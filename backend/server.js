const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const Groq = require('groq-sdk');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MOCK_AI_CHAT = process.env.MOCK_AI_CHAT === 'true';

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

// ── Groq client ───────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: GROQ_API_KEY });

// ── Middleware ─────────────────────────────────────────────────────────────────

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// ── File storage ──────────────────────────────────────────────────────────────

const uploadBaseDir = path.join(__dirname, 'uploads');
const uploadCertificatesDir = path.join(uploadBaseDir, 'certificates');
const cvDir = path.join(__dirname, '..', 'public');

fs.mkdirSync(uploadCertificatesDir, { recursive: true });
fs.mkdirSync(cvDir, { recursive: true });

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
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

const uploadCV = multer({
  storage: cvStorage,
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
const adminTokens = new Set();

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || !adminTokens.has(token)) {
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
  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.add(token);
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

      const fileUrl = `/uploads/certificates/${req.file.filename}`;
      const newCertificate = await Certificate.create({
        title,
        event,
        college,
        location,
        description,
        fileUrl,
        date: new Date().toISOString().split('T')[0],
      });

      res.status(201).json({ success: true, certificate: newCertificate });
    } catch (error) {
      console.error('Error uploading certificate:', error);
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

    if (certificate.fileUrl && certificate.fileUrl.startsWith('/uploads/certificates/')) {
      const filePath = path.join(__dirname, certificate.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

    const project = await Project.create({
      title,
      role,
      description,
      link: link || '',
      highlights: Array.isArray(highlights) ? highlights : [],
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

// ── CV upload ─────────────────────────────────────────────────────────────────

app.post('/api/admin/upload-cv', requireAdmin, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CV PDF file is required' });
    }
    res.status(201).json({ success: true, fileUrl: '/cv.pdf' });
  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({ success: false, message: 'Failed to upload CV' });
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