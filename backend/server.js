const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const Groq = require('groq-sdk');
const { v2: cloudinary } = require('cloudinary');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MOCK_AI_CHAT = process.env.MOCK_AI_CHAT === 'true';
const USE_CLOUDINARY = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

// ── Validation ────────────────────────────────────────────────────────────────

if (!MONGODB_URI) {
  console.error('✗ Missing MONGODB_URI in .env');
  process.exit(1);
}

if (!process.env.BREVO_API_KEY) {
  console.warn('⚠ Warning: BREVO_API_KEY not set. Contact form emails will fail.');
}

if (!process.env.SENDER_EMAIL) {
  console.warn('⚠ Warning: SENDER_EMAIL not set. Contact form emails will fail.');
}

if (!process.env.CONTACT_RECEIVER_EMAIL) {
  console.warn('⚠ Warning: CONTACT_RECEIVER_EMAIL not set. Falling back to SENDER_EMAIL.');
}

if (!GROQ_API_KEY) {
  console.warn('⚠ Warning: GROQ_API_KEY not set. AI Chat will use mock responses.');
}

// ── Models ────────────────────────────────────────────────────────────────────

const ContactMessage = require('./models/ContactMessage');
const Certificate = require('./models/Certificate');
const Project = require('./models/Project');
const ChatSession = require('./models/ChatSession');
const Resume = require('./models/Resume');

// ── Groq client ───────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: GROQ_API_KEY });

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('Cloudinary env vars not set. Uploads will use local disk, which is not durable on Render.');
}

// ── Middleware ─────────────────────────────────────────────────────────────────

const defaultLocalOrigins =
  process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];
const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...frontendOrigins, ...configuredOrigins, ...defaultLocalOrigins]));

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ── File storage ──────────────────────────────────────────────────────────────

const uploadBaseDir = path.join(__dirname, 'uploads');
const uploadCertificatesDir = path.join(uploadBaseDir, 'certificates');
const cvDir = path.join(uploadBaseDir, 'resume');

fs.mkdirSync(uploadCertificatesDir, { recursive: true });
fs.mkdirSync(cvDir, { recursive: true });

const cvPath = path.join(cvDir, 'cv.pdf');

const getPublicBaseUrl = (req) => {
  const configuredUrl = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
};

const toPublicUrl = (req, relativePath) => {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${getPublicBaseUrl(req)}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
};

const localPathFromPublicUrl = (fileUrl) => {
  if (!fileUrl) return null;
  let pathname = fileUrl;
  try {
    pathname = new URL(fileUrl).pathname;
  } catch (_) {
    pathname = fileUrl;
  }
  if (!pathname.startsWith('/uploads/')) return null;
  const resolvedPath = path.resolve(uploadBaseDir, pathname.replace(/^\/uploads\//, ''));
  const resolvedBase = path.resolve(uploadBaseDir);
  return resolvedPath.startsWith(resolvedBase) ? resolvedPath : null;
};

const uploadBufferToCloudinary = (file, folder, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'raw',
        overwrite: true,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });

app.get('/health', (req, res) => {
  res.json({
    success: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    storage: USE_CLOUDINARY ? 'cloudinary' : 'local',
  });
});

app.get('/cv.pdf', async (req, res) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (resume?.provider === 'cloudinary' && resume.fileUrl) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.redirect(resume.fileUrl);
    }

    if (!fs.existsSync(cvPath)) {
      return res.status(404).send('Not found');
    }
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Content-Disposition', 'inline; filename="cv.pdf"');
    return res.sendFile(cvPath);
  } catch (err) {
    console.error('Error serving CV:', err);
    return res.status(500).send('Failed to serve CV');
  }
});

app.use('/uploads', express.static(uploadBaseDir));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadCertificatesDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cvDir),
  filename: (req, file, cb) => cb(null, 'cv.pdf'),
});

const upload = multer({
  storage: USE_CLOUDINARY ? multer.memoryStorage() : fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

const uploadCV = multer({
  storage: USE_CLOUDINARY ? multer.memoryStorage() : cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// ── Admin auth ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'portfolio-admin-secret-key-change-in-production';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Generate a signed token
const generateAdminToken = () => {
  const payload = `admin:${Date.now()}`;
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}:${signature}`;
};

// Verify a signed token
// const verifyAdminToken = (token) => {
//   if (!token || typeof token !== 'string') return false;
//   const parts = token.split(':');
//   if (parts.length !== 3) return false; // payload:timestamp:signature
  
//   const [prefix, timestamp, signature] = parts;
//   if (prefix !== 'admin') return false;
  
//   const payload = `${prefix}:${timestamp}`;
//   const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  
//   return signature === expectedSignature;
// };

//30june admin token verification 
const verifyAdminToken = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [prefix, timestamp, signature] = parts;

  if (prefix !== 'admin') return false;

  const payload = `${prefix}:${timestamp}`;

  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return false;
  }

  const issuedAt = Number(timestamp);

  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  if (Date.now() - issuedAt > TOKEN_EXPIRY_MS) {
    return false;
  }

  return true;
};


const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ── Routes ─────────────────────────────────────────────────────────────────────

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid admin password' });
  }
  const token = generateAdminToken();
  res.json({ success: true, token });
});

// ── Contact ───────────────────────────────────────────────────────────────────

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, message) are required',
      });
    }

    const receiverEmail =
      process.env.CONTACT_RECEIVER_EMAIL || process.env.SENDER_EMAIL;

    // Send via Brevo REST API (port 443 — not blocked on Render free tier)
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Bharath Portfolio',
          email: process.env.SENDER_EMAIL,
        },
        to: [{ email: receiverEmail }],
        replyTo: { email: escapeHtml(email), name: escapeHtml(name) },
        subject: `Portfolio Contact: New message from ${escapeHtml(name)}`,
        htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      },
      {
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
      }
    );

    // Persist to MongoDB
    await ContactMessage.create({ name, email, message });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// ── Certificates ──────────────────────────────────────────────────────────────

app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ date: -1 });
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
});

app.post(
  '/api/certificates/upload',
  requireAdmin,
  upload.single('certificate'),
  async (req, res) => {
    let uploadedPublicId = '';
    let localUploadedPath = req.file?.path || '';
    try {
      const { title, event, college, location, description } = req.body;

      if (!title || !event || !college || !location || !description) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: title, event, college, location, description',
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Certificate PDF file is required' });
      }

      let fileUrl = '';
      let provider = 'local';

      if (USE_CLOUDINARY) {
        const safeOriginalName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const uploadResult = await uploadBufferToCloudinary(
          req.file,
          'portfolio/certificates',
          `${Date.now()}-${safeOriginalName}`
        );
        fileUrl = uploadResult.secure_url;
        uploadedPublicId = uploadResult.public_id;
        provider = 'cloudinary';
      } else {
        fileUrl = toPublicUrl(req, `/uploads/certificates/${req.file.filename}`);
      }

      const newCertificate = await Certificate.create({
        title,
        event,
        college,
        location,
        description,
        fileUrl,
        publicId: uploadedPublicId,
        provider,
        date: new Date().toISOString().split('T')[0],
      });

      res.status(201).json({ success: true, certificate: newCertificate });
    } catch (error) {
      console.error('Error uploading certificate:', error);
      if (uploadedPublicId) {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'raw' }).catch((destroyError) => {
          console.warn('Could not clean up Cloudinary certificate after failed save:', destroyError.message);
        });
      }
      if (localUploadedPath && fs.existsSync(localUploadedPath)) {
        fs.unlink(localUploadedPath, (unlinkError) => {
          if (unlinkError) console.warn('Could not clean up local certificate after failed save:', unlinkError.message);
        });
      }
      res.status(500).json({ success: false, message: 'Failed to upload certificate' });
    }
  }
);

app.patch('/api/certificates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, event, college, location, description, fileUrl, date } = req.body;
    const updates = { title, event, college, location, description, fileUrl, date };

    const updated = await Certificate.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, certificate: updated });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ success: false, message: 'Failed to update certificate' });
  }
});

app.delete('/api/certificates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (certificate.publicId && certificate.provider === 'cloudinary') {
      await cloudinary.uploader.destroy(certificate.publicId, { resource_type: 'raw' }).catch((destroyError) => {
        console.warn('Could not delete Cloudinary certificate:', destroyError.message);
      });
    } else {
      const filePath = localPathFromPublicUrl(certificate.fileUrl);
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Certificate.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certificate' });
  }
});

// ── Projects ──────────────────────────────────────────────────────────────────

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', requireAdmin, async (req, res) => {
  try {
    const { title, role, description, link, highlights, gradient } = req.body;

    if (!title || !role || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, role, description',
      });
    }

    const normalizedHighlights = Array.isArray(highlights)
      ? highlights.map((item) => String(item).trim()).filter(Boolean)
      : typeof highlights === 'string'
      ? highlights.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

    const project = await Project.create({
      title,
      role,
      description,
      link: link || '',
      highlights: normalizedHighlights,
      gradient: gradient || 'from-neon-purple/20 to-neon-blue/5',
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

app.patch('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, role, description, link, highlights, gradient } = req.body;

    const normalizedHighlights = Array.isArray(highlights)
      ? highlights
      : typeof highlights === 'string'
      ? highlights.split(',').map((item) => item.trim()).filter(Boolean)
      : highlights;

    const updated = await Project.findByIdAndUpdate(
      id,
      { title, role, description, link, highlights: normalizedHighlights, gradient },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

// ── Resume ────────────────────────────────────────────────────────────────────

const getResumeResponse = (req, resume) => ({
  ...resume.toObject(),
  fileUrl: `${getPublicBaseUrl(req)}/cv.pdf?ts=${Date.now()}`,
});

const deleteResumeFile = async (resume) => {
  if (!resume) return;

  if (resume.provider === 'cloudinary' && resume.publicId) {
    await cloudinary.uploader.destroy(resume.publicId, { resource_type: 'raw' }).catch((destroyError) => {
      console.warn('Could not delete Cloudinary resume:', destroyError.message);
    });
    return;
  }

  if (fs.existsSync(cvPath)) {
    fs.unlinkSync(cvPath);
  }
};

const saveSingleResume = async (req, file) => {
  const previousResume = await Resume.findOne().sort({ updatedAt: -1 });
  let uploadedPublicId = '';
  let storedFileUrl = '/uploads/resume/cv.pdf';
  let provider = 'local';

  if (USE_CLOUDINARY) {
    const uploadResult = await uploadBufferToCloudinary(file, 'portfolio/resume', 'cv');
    uploadedPublicId = uploadResult.public_id;
    storedFileUrl = uploadResult.secure_url;
    provider = 'cloudinary';
  }

  const resume = await Resume.findOneAndUpdate(
    {},
    {
      fileUrl: storedFileUrl,
      publicId: uploadedPublicId,
      provider,
      originalName: file.originalname || 'resume.pdf',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Resume.deleteMany({ _id: { $ne: resume._id } });

  if (
    previousResume?.provider === 'cloudinary' &&
    previousResume._id.toString() !== resume._id.toString()
  ) {
    await deleteResumeFile(previousResume);
  }

  return resume;
};

app.get('/api/resume', async (req, res) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.json({ success: true, resume: getResumeResponse(req, resume) });
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resume' });
  }
});

app.post('/api/resume', requireAdmin, uploadCV.single('resume'), async (req, res) => {
  let uploadedPublicId = '';
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume PDF file is required' });
    }

    const resume = await saveSingleResume(req, req.file);
    uploadedPublicId = resume.publicId;
    res.status(201).json({ success: true, resume: getResumeResponse(req, resume) });
  } catch (error) {
    console.error('Error uploading resume:', error);
    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'raw' }).catch((destroyError) => {
        console.warn('Could not clean up Cloudinary resume after failed save:', destroyError.message);
      });
    }
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
});

app.post('/api/admin/upload-cv', requireAdmin, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume PDF file is required' });
    }

    const resume = await saveSingleResume(req, req.file);
    res.status(201).json({ success: true, fileUrl: getResumeResponse(req, resume).fileUrl, resume });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
});

app.delete('/api/resume', requireAdmin, async (req, res) => {
  try {
    const resume = await Resume.findOne().sort({ updatedAt: -1 });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    await deleteResumeFile(resume);
    await Resume.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resume' });
  }
});

// ── Seed ──────────────────────────────────────────────────────────────────────

app.post('/api/admin/seed', requireAdmin, async (req, res) => {
  try {
    const sampleProjects = [
      {
        title: 'Smart Farming AI Advisory System',
        role: 'Lead Developer',
        description:
          'Offline AI pipeline using RandomForestClassifier that predicts crop risks and gives recommendations.',
        link: 'https://crop-ai-advisor.vercel.app/',
        highlights: ['Reproducibility', 'Robust data handling', 'Offline-first'],
        gradient: 'from-neon-purple/20 to-neon-blue/5',
      },
      {
        title: 'EcoFinds - Fullstack Marketplace',
        role: 'Fullstack Developer',
        description:
          'Sustainable e-commerce platform built with Node.js, Express.js, React and Tailwind CSS, featuring real-time inventory and secure payments.',
        link: 'https://eco-finds-beta.vercel.app/',
        highlights: ['Fullstack', 'Sustainability', 'Marketing'],
        gradient: 'from-neon-violet/20 to-neon-magenta/5',
      },
      {
        title: 'Project Drishti: AI Crowd Detection',
        role: 'Computer Vision Developer',
        description:
          'Real-time crowd detection using YOLOv8 + OpenCV, optimized for speed and varying conditions.',
        highlights: ['Real-time', 'YOLOv8', 'Optimized performance'],
        gradient: 'from-accent/20 to-neon-cyan/5',
      },
    ];

    const sampleCertificates = [
      {
        title: 'Mini-Anveshana 2024',
        event: 'Idea Presentation Contest',
        college: 'SDM Institute of Technology (SDMIT)',
        location: 'Ujire',
        description:
          'Certificate of Appreciation for participating in the Mini-Anveshana 2024 idea presentation contest.',
        fileUrl: '/certificates/mini-anveshana-2024.pdf',
        date: '18 October 2024',
      },
      {
        title: 'INFOTHON 4.0',
        event: 'National Level Hackathon',
        college: 'Vidyavardhaka College of Engineering',
        location: 'Mysore',
        description: 'Certificate of participation for the 24-hour INFOTHON 4.0 hackathon event.',
        fileUrl: '/certificates/infothon-4-0-2025.pdf',
        date: '15-16 February 2025',
      },
      {
        title: "Nexovate'25",
        event: 'National Level Hackathon',
        college: 'Presidency University Bengaluru',
        location: 'Bengaluru',
        description:
          "Certificate of participation for Nexovate'25 national level hackathon organized by Harvest Club.",
        fileUrl: '/certificates/nexovate-25-2025.pdf',
        date: '29-30 August 2025',
      },
    ];

    await Promise.all(
      sampleProjects.map((project) =>
        Project.findOneAndUpdate({ title: project.title }, { $set: project }, { upsert: true, new: true })
      )
    );

    await Promise.all(
      sampleCertificates.map((certificate) =>
        Certificate.findOneAndUpdate(
          { title: certificate.title },
          { $set: certificate },
          { upsert: true, new: true }
        )
      )
    );

    const certificates = await Certificate.find().sort({ date: -1 });
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, certificates, projects });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ success: false, message: 'Failed to seed data' });
  }
});

// ── AI Chat ───────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const chatSessionId = sessionId || `session_${Date.now()}`;

    const systemPrompt = `You are Bharath Singh Gujjar's AI Assistant 🤖. Answer all questions about him with clean, structured, and visually appealing responses.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BHARATH'S PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Education: B.E. CSE at S D M Institute of Technology (CGPA 8.68/10)
🎯 Focus: Backend Development • AI Systems • Data Structures & Algorithms
🏢 Currently: Pursuing degree (2023-Ongoing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 Languages: Java, C
🔧 Backend: Spring Boot, Node.js, Express.js
🎨 Frontend: React
🤖 AI/ML: YOLOv8, Scikit-Learn, Pandas, NumPy
🗄️ Databases: MongoDB, PostgreSQL
📊 Specialties: DSA, scaling systems, ML deployment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📏 LENGTH RULES:
• Brief answers (1-2 lines): General/contact questions
• Medium answers (3-5 bullet points): Skills overview, project names
• Detailed answers (full breakdown): Specific project details, deep-dive questions
• Always offer to expand: "Want to know more?" or "Ask me about..."

🎨 FORMATTING RULES:
• Use emojis naturally (1-2 per section, not excessive)
• Use section headers with emojis
• Use bullet points instead of paragraphs
• Use bold for key terms: **Spring Boot**, **YOLOv8**, etc.
• Use separators (━━━) only for major sections, not between every item
• Add a conversational closing: "Anything else?" or "Let me know if..."

💬 TONE:
• Friendly but professional
• Conversational, not robotic
• Helpful and encouraging
• Short sentences (not rambling)
• Direct and to-the-point

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOLDEN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Always relate answers to Bharath's real work
✅ Use bullet points — never dump long paragraphs
✅ Add emojis naturally (1-2 per section max)
✅ Offer follow-up questions to keep conversation flowing
✅ Keep each line short and readable
✅ If unsure about something, say "I don't have that info"
✅ Be encouraging — show enthusiasm about his work
✅ Never make up skills or projects not listed above`;

    const historyMessages = Array.isArray(history)
      ? history
          .filter((item) => item && item.role && item.content)
          .map((item) => ({ role: item.role, content: item.content }))
      : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message.trim() },
    ];

    let reply = '';

    const mockResponses = [
      "I'm Bharath's AI assistant! He's a passionate full-stack developer specializing in React, Node.js, and MongoDB.",
      'His projects include Smart Farming AI, EcoFinds marketplace, Project Drishti crowd detection, and more.',
      'Bharath has strong skills in backend development, computer vision, and machine learning.',
      'You can contact Bharath through the contact form on his portfolio site.',
      'He primarily uses Spring Boot, Node.js, React, MongoDB, and YOLOv8 in his projects.',
    ];

    if (MOCK_AI_CHAT || !GROQ_API_KEY) {
      console.log('⚠ MOCK MODE active. Set MOCK_AI_CHAT=false and add GROQ_API_KEY to use real AI.');
      reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    } else {
      try {
        console.log('🔄 Calling Groq API for:', message.substring(0, 50));

        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',   // ← fixed: was 'openai/gpt-oss-20b' (invalid)
          messages,
          max_tokens: 500,
          temperature: 0.8,
        });

        reply = completion.choices?.[0]?.message?.content?.trim() || '';
        console.log('✅ Groq success:', reply.substring(0, 60));

        if (!reply) throw new Error('Empty response from Groq');
      } catch (groqError) {
        console.error('❌ Groq failed:', groqError?.message);
        return res.status(500).json({
          success: false,
          message: `AI Error: ${groqError?.message || 'Unknown error'}`,
        });
      }
    }

    const chatSession = await ChatSession.findOneAndUpdate(
      { sessionId: chatSessionId },
      {
        $set: { updatedAt: new Date() },
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message.trim() },
              { role: 'assistant', content: reply },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, reply, sessionId: chatSession.sessionId });
  } catch (error) {
    console.error('Error in chat endpoint:', error?.message || error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to process chat message' });
  }
});

// Chat session retrieval
app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    res.json({ success: true, session: chatSession });
  } catch (error) {
    console.error('Error fetching chat session:', error?.message || error);
    res.status(500).json({ success: false, message: 'Failed to fetch chat session' });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.use((error, req, res, next) => {
  if (error.message?.startsWith('CORS blocked origin')) {
    console.warn(error.message);
    return res.status(403).json({ success: false, message: 'Origin is not allowed by CORS' });
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'PDF file must be 10MB or smaller' : error.message;
    return res.status(400).json({ success: false, message });
  }

  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ success: false, message: error.message });
  }

  console.error('Unhandled server error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');

    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}`);
      console.log(`✓ Chat endpoint: http://localhost:${PORT}/api/chat`);
      if (MOCK_AI_CHAT) console.log('⚠ Mock AI Chat enabled (MOCK_AI_CHAT=true)');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const nextPort = parseInt(PORT) + 1;
        console.warn(`⚠ Port ${PORT} in use. Trying port ${nextPort}...`);

        const retryServer = app.listen(nextPort, () => {
          console.log(`✓ Server running on fallback port ${nextPort}`);
          console.log(`✓ Update your frontend API_BASE_URL to http://localhost:${nextPort}`);
        });

        retryServer.on('error', () => {
          console.error(`✗ Could not start on port ${nextPort} either. Kill the process on port ${PORT}.`);
          process.exit(1);
        });
      } else {
        console.error('✗ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

startServer();
