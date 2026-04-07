const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const MONGODB_URI = process.env.MONGODB_URI;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('Missing EMAIL_USER or EMAIL_PASS in backend/.env');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

const ContactMessage = require('./models/ContactMessage');
const Certificate = require('./models/Certificate');

// Middleware
app.use(cors());
app.use(express.json());

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
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
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
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

app.post('/api/certificates', async (req, res) => {
  try {
    const { title, event, college, location, description, fileUrl } = req.body;

    if (!title || !event || !college || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, event, college, location, description'
      });
    }

    const newCertificate = await Certificate.create({
      title,
      event,
      college,
      location,
      description,
      fileUrl: fileUrl || '',
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, certificate: newCertificate });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create certificate'
    });
  }
});

// AI Chat route (placeholder - integrate with OpenAI later)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Placeholder response - replace with actual AI integration
    const responses = [
      "I'm Bharath, a passionate full-stack developer with expertise in React, Node.js, and modern web technologies.",
      "I love creating beautiful, responsive web applications that provide great user experiences.",
      "Feel free to reach out if you'd like to discuss potential projects or collaborations!",
      "I'm always excited to work on innovative solutions and learn new technologies."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      success: true,
      reply: randomResponse
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

startServer();