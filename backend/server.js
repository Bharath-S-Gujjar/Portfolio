const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const Groq = require('groq-sdk');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const MONGODB_URI = process.env.MONGODB_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MOCK_AI_CHAT = process.env.MOCK_AI_CHAT === 'true';

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('Missing EMAIL_USER or EMAIL_PASS in backend/.env');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY not set. AI Chat will use mock responses.');
}

const ContactMessage = require('./models/ContactMessage');
const Certificate = require('./models/Certificate');
const Project = require('./models/Project');
const ChatSession = require('./models/ChatSession');

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY
});

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

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
  }
});

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, cvDir),
  filename: (req, file, cb) => cb(null, 'cv.pdf'),
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

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

// Configure nodemailer transporter


// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASS
//   }
// });

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer transporter verification failed:', error);
  } else {
    console.log('Nodemailer transporter verified successfully');
  }
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');

    // Start server with fallback port handling
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}`);
      console.log(`✓ Chat endpoint: http://localhost:${PORT}/api/chat`);
      if (MOCK_AI_CHAT) {
        console.log('✓ Mock AI Chat enabled (MOCK_AI_CHAT=true)');
      }
    });

    // Handle port conflicts
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const nextPort = parseInt(PORT) + 1;
        console.warn(`⚠ Port ${PORT} is already in use. Trying port ${nextPort}...`);
        
        const retryServer = app.listen(nextPort, () => {
          console.log(`✓ Server running on fallback port ${nextPort}`);
          console.log(`✓ Update your frontend API_BASE_URL to http://localhost:${nextPort}`);
        });

        retryServer.on('error', (retryError) => {
          console.error(`✗ Could not start server on port ${nextPort} either.`);
          console.error(`✗ Please kill the process using port ${PORT}:`);
          console.error(`  Windows: netstat -ano | findstr :${PORT} && taskkill /PID <PID> /F`);
          console.error(`  Mac/Linux: lsof -i :${PORT} | awk 'NR!=1 {print $2}' | xargs kill -9`);
          process.exit(1);
        });
      } else {
        console.error('✗ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    console.error('✗ Make sure MongoDB is running and MONGODB_URI is correct');
    process.exit(1);
  }
}


// Contact route
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, message) are required'
      });
    }

    // Send email
    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_USER,
      subject: 'Portfolio Contact',
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    await ContactMessage.create({ name, email, message });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// Certificates routes
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ date: -1 });
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates'
    });
  }
});

app.post('/api/certificates/upload', requireAdmin, upload.single('certificate'), async (req, res) => {
  try {
    const { title, event, college, location, description } = req.body;

    if (!title || !event || !college || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, event, college, location, description'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Certificate PDF file is required'
      });
    }

    const fileUrl = `/uploads/certificates/${req.file.filename}`;
    const newCertificate = await Certificate.create({
      title,
      event,
      college,
      location,
      description,
      fileUrl,
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, certificate: newCertificate });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificate'
    });
  }
});

app.post('/api/admin/upload-cv', requireAdmin, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CV PDF file is required' });
    }
    res.status(201).json({ success: true, fileUrl: '/cv.pdf' });
  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload CV'
    });
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
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Certificate.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certificate' });
  }
});

// Projects routes
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
      return res.status(400).json({ success: false, message: 'Required fields: title, role, description' });
    }
    const project = await Project.create({
      title,
      role,
      description,
      link: link || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      gradient: gradient || 'from-neon-purple/20 to-neon-blue/5'
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
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

// Admin login route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid admin password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.add(token);
  res.json({ success: true, token });
});

app.patch('/api/certificates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ title, event, college, location, description, fileUrl, date }) => ({
      title,
      event,
      college,
      location,
      description,
      fileUrl,
      date,
    }))(req.body);

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

app.patch('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ title, role, description, link, highlights, gradient }) => ({
      title,
      role,
      description,
      link,
      highlights: Array.isArray(highlights) ? highlights : typeof highlights === 'string' ? highlights.split(',').map((item) => item.trim()).filter(Boolean) : highlights,
      gradient,
    }))(req.body);

    const updated = await Project.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

app.post('/api/admin/seed', requireAdmin, async (req, res) => {
  try {
    const sampleProjects = [
      {
        title: 'Smart Farming AI Advisory System',
        role: 'Lead Developer',
        description: 'Offline AI pipeline using RandomForestClassifier that predicts crop risks and gives recommendations.',
        link: 'https://crop-ai-advisor.vercel.app/',
        highlights: ['Reproducibility', 'Robust data handling', 'Offline-first'],
        gradient: 'from-neon-purple/20 to-neon-blue/5',
      },
      {
        title: 'EcoFinds - Fullstack Marketplace',
        role: 'Fullstack Developer',
        description: 'Sustainable e-commerce platform built with Node js, Express js, React and Tailwind CSS, featuring real-time inventory and secure payments.',
        link: 'https://eco-finds-beta.vercel.app/',
        highlights: ['Fullstack', 'Sustainability', 'Marketing'],
        gradient: 'from-neon-violet/20 to-neon-magenta/5',
      },
      {
        title: 'Project Drishti: AI Crowd Detection',
        role: 'Computer Vision Developer',
        description: 'Real-time crowd detection using YOLOv8 + OpenCV, optimized for speed and varying conditions.',
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
        description: 'Certificate of Appreciation for participating in the Mini-Anveshana 2024 idea presentation contest.',
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
        title: 'Nexovate’25',
        event: 'National Level Hackathon',
        college: 'Presidency University Bengaluru',
        location: 'Bengaluru',
        description: 'Certificate of participation for Nexovate’25 national level hackathon organized by Harvest Club.',
        fileUrl: '/certificates/nexovate-25-2025.pdf',
        date: '29-30 August 2025',
      },
    ];

    await Promise.all(sampleProjects.map((project) =>
      Project.findOneAndUpdate(
        { title: project.title },
        { $set: project },
        { upsert: true, new: true }
      )
    ));

    await Promise.all(sampleCertificates.map((certificate) =>
      Certificate.findOneAndUpdate(
        { title: certificate.title },
        { $set: certificate },
        { upsert: true, new: true }
      )
    ));

    const certificates = await Certificate.find().sort({ date: -1 });
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, certificates, projects });
  } catch (error) {
    console.error('Error seeding admin data:', error);
    res.status(500).json({ success: false, message: 'Failed to seed data' });
  }
});

// AI Chat route - Groq chat integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
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

📋 RESPONSE TEMPLATES:

FOR "WHAT SKILLS DOES HE HAVE?":
✨ **Bharath's Tech Toolkit**
• **Backend**: Spring Boot (Java), Node.js, Express.js
• **Frontend**: React with modern design
• **AI/ML**: YOLOv8 for computer vision, Scikit-Learn for classic ML
• **Databases**: MongoDB (NoSQL), PostgreSQL (relational)
• **Core**: Strong DSA, system design, ML integration

Want details on any specific area?

FOR "WHAT PROJECTS HAS HE BUILT?":
🚀 **4 Main Projects**
• **Smart Farming AI** — ML-powered crop risk prediction
• **EcoFinds** — Full-stack sustainable marketplace
• **Project Drishti** — Real-time crowd detection with YOLOv8
• **Anemia Detection App** — Offline mobile health screening

Ask about any project for more details!

FOR SPECIFIC PROJECT (e.g., "Tell me about EcoFinds"):
💼 **EcoFinds — Sustainable E-Commerce Marketplace**
What it does:
• Full-stack platform for buying/selling eco-friendly products
• Real-time inventory management
• Secure payment integration

Tech used:
• Frontend: React with Tailwind CSS
• Backend: Node.js + Express.js
• Database: MongoDB + PostgreSQL
• Focus: Sustainability, user experience, scalability

Curious about the tech stack or design decisions?

FOR CONTACT QUESTION:
📧 **Getting in Touch**
Use the **contact form** on his portfolio website — quickest way to reach him! You can also find his LinkedIn profile there.

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
      { role: 'user', content: message.trim() }
    ];

    let reply = '';
    const mockResponses = [
      "I'm Bharath, a passionate full-stack developer specializing in React, Node.js, TypeScript, and MongoDB.",
      "My projects include modern portfolio websites, full-stack apps, and backend services built with Express and MongoDB.",
      "Bharath has strong skills in frontend design, responsive UIs, and backend API development.",
      "You can contact Bharath through his email or LinkedIn profile listed on the portfolio site.",
      "He primarily uses React, Node.js, Tailwind CSS, MongoDB, and Express for web application development."
    ];

    if (MOCK_AI_CHAT || !GROQ_API_KEY) {
      console.log('❌ MOCK MODE: Set MOCK_AI_CHAT=false and verify GROQ_API_KEY in .env');
      reply = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    } else {
      try {
        console.log('🔄 Calling Groq API for:', message.substring(0, 50));
        const completion = await groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          messages,
          max_tokens: 500,
          temperature: 0.8
        });

        reply = completion.choices?.[0]?.message?.content?.trim() || '';
        console.log('✅ Groq Success:', reply.substring(0, 60));
        
        if (!reply) {
          throw new Error('Empty response from Groq');
        }
      } catch (groqError) {
        const errorMsg = groqError?.message || 'Unknown error';
        console.error('❌ Groq failed:', errorMsg);
        
        return res.status(500).json({
          success: false,
          message: `AI Error: ${errorMsg}`
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
              { role: 'assistant', content: reply }
            ]
          }
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, reply, sessionId: chatSession.sessionId });
  } catch (error) {
    console.error('Error in chat endpoint:', error?.message || error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to process chat message'
    });
  }
});

// Chat session retrieval route
app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({ success: true, session: chatSession });
  } catch (error) {
    console.error('Error fetching chat session:', error?.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session'
    });
  }
});

startServer();