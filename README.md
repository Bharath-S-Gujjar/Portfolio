# 🌟 Portfolio Website - Project Bloom

A modern, fully-featured portfolio website with an integrated AI chatbot, certificate management system, and contact form. Built with React + TypeScript for the frontend and Node.js + Express for the backend.

---

## ✨ Key Features

### 🎨 Frontend Features
- **Responsive Design** — Optimized for desktop, tablet, and mobile devices
- **Animated Sections** — Smooth scroll animations powered by Framer Motion
- **Hero Section** — Eye-catching introduction with animated background
- **Skills Showcase** — Display technical skills with visual indicators
- **Projects Portfolio** — Interactive project cards with descriptions
- **Achievements/Certificates** — Gallery of certifications and accomplishments
- **About Section** — Professional bio and background information
- **Contact Form** — Email validation and submission to backend
- **Floating AI Chatbot** — Interactive AI assistant using Groq API
- **Admin Panel** — Manage certificates and view contact messages
- **Modern UI Components** — Built with shadcn/ui and Radix UI

### 🔧 Backend Features
- **Express.js REST API** — RESTful endpoints for all operations
- **MongoDB Integration** — Persistent data storage with Mongoose
- **Contact Management** — Store and manage contact form submissions
- **Certificate Upload** — PDF upload and storage with file management
- **AI Chat Integration** — Real-time AI responses via Groq SDK
- **Chat Session History** — Persistent conversation tracking
- **Email Notifications** — Send contact emails via Brevo API
- **CORS Support** — Configured for multiple origins
- **Mock Mode** — Optional mock AI chat for development/testing

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **shadcn/ui & Radix UI** | Component library |
| **React Router** | Client-side routing |
| **React Hook Form** | Form state management |
| **@tanstack/react-query** | Server state management |
| **Zod** | Schema validation |
| **lucide-react** | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **Groq SDK** | AI chat API |
| **Multer** | File upload handling |
| **Brevo API** | Email service |
| **Axios** | HTTP client |
| **Dotenv** | Environment variable management |

---

## 📁 Project Structure

```
portfolio/
├── src/                           # Frontend React application
│   ├── components/
│   │   ├── AboutSection.tsx       # About & bio section
│   │   ├── AchievementsSection.tsx # Certificates gallery
│   │   ├── AIChatbot.tsx          # Floating chatbot UI
│   │   ├── AnimatedBackground.tsx # Background animations
│   │   ├── ContactSection.tsx     # Contact form
│   │   ├── HeroSection.tsx        # Hero/welcome section
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── ProjectsSection.tsx   # Portfolio projects
│   │   ├── ScrollReveal.tsx      # Scroll animation wrapper
│   │   ├── SkillsSection.tsx     # Technical skills
│   │   └── ui/                   # shadcn/ui components (40+ components)
│   ├── pages/
│   │   ├── Index.tsx             # Main portfolio page
│   │   ├── AdminPanel.tsx        # Certificate & message management
│   │   ├── NotFound.tsx          # 404 page
│   │   └── UploadCertificate.tsx # Certificate upload
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── api.ts               # API client utilities
│   │   └── utils.ts             # General utilities
│   ├── test/                    # Vitest test files
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
│
├── backend/                      # Node.js/Express backend
│   ├── server.js               # Main server file
│   ├── models/
│   │   ├── Certificate.js      # Certificate schema
│   │   ├── ChatSession.js      # Chat history schema
│   │   ├── ContactMessage.js   # Contact form schema
│   │   └── Project.js          # Projects schema
│   ├── uploads/
│   │   └── certificates/       # Uploaded PDF storage
│   ├── render.yaml             # Render deployment config
│   ├── package.json            # Backend dependencies
│   └── .env.example            # Environment template
│
├── public/                      # Static assets
│   ├── certificates/           # Certificate metadata
│   └── robots.txt
│
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── vercel.json                # Vercel deployment config
├── components.json            # shadcn/ui config
└── package.json               # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm or bun
- **MongoDB** (local or MongoDB Atlas cloud)
- **Git** for version control

### Quick Start - Local Development

#### 1️⃣ Frontend Setup

```bash
# Clone and navigate to the project
cd portfolio

# Install dependencies
npm install
# or with bun
bun install

# Start development server
npm run dev
# or
bun run dev
```

The frontend will run at `http://localhost:5173`

#### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with required variables
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
GROQ_API_KEY=your-groq-api-key
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-email@gmail.com
CONTACT_RECEIVER_EMAIL=recipient@gmail.com
MOCK_AI_CHAT=false
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
NODE_ENV=development
EOF

# Start development server
npm run dev
```

The backend will run at `http://localhost:5000`

#### 3️⃣ Frontend Environment Variables

Create `.env` in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Type | Description |
|----------|------|-------------|
| `PORT` | number | Server port (default: 5000) |
| `MONGODB_URI` | string | MongoDB connection string |
| `GROQ_API_KEY` | string | API key for Groq AI service |
| `BREVO_API_KEY` | string | API key for email service |
| `SENDER_EMAIL` | string | Email address for sending messages |
| `CONTACT_RECEIVER_EMAIL` | string | Email to receive contact form submissions |
| `MOCK_AI_CHAT` | boolean | Use mock responses when API unavailable |
| `ALLOWED_ORIGINS` | string | Comma-separated CORS origins |
| `NODE_ENV` | string | Environment (development/production) |

### Frontend (`.env` or `.env.local`)

| Variable | Type | Description |
|----------|------|-------------|
| `VITE_API_BASE_URL` | string | Backend API URL |

---

## 📡 API Endpoints

### Contact Messages
- **POST** `/api/contact` — Submit contact form
  - Body: `{ name, email, message }`
  - Returns: Success message + email notification

### Certificates
- **GET** `/api/certificates` — List all certificates
- **POST** `/api/certificates/upload` — Upload certificate PDF
  - FormData: `{ file: File, title, issuer, dateIssued }`
- **GET** `/api/certificates/:id` — Get certificate details
- **DELETE** `/api/certificates/:id` — Delete certificate

### AI Chat
- **POST** `/api/chat` — Send message to AI chatbot
  - Body: `{ message, sessionId }`
  - Returns: `{ response, sessionId }`
- **GET** `/api/chat/sessions/:sessionId` — Get chat history
- **POST** `/api/chat/sessions/:sessionId/clear` — Clear session history

---

## 🧪 Testing & Development

### Frontend Testing
```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
# Frontend
npm run build

# Preview production build
npm run preview

# Development build with source maps
npm run build:dev
```

---

## 📦 Available Scripts

### Frontend
```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run build:dev   # Dev build with source maps
npm run preview     # Preview production build
npm run test        # Run tests
npm run test:watch  # Watch mode tests
npm run lint        # Run ESLint
```

### Backend
```bash
npm start           # Run server
npm run dev         # Run with nodemon (auto-reload)
```

---

## 🌐 Deployment

### Frontend Deployment (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Auto-deploys on push to main branch

### Backend Deployment (Render.com)
1. Create Render account
2. Connect GitHub repository
3. Use `backend/render.yaml` configuration
4. Set environment variables in Render dashboard
5. Deploy!

**Deployment Stack:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas (Free tier)
- Emails: Brevo
- AI: Groq API

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📝 File Upload Configuration

- **Max File Size:** 10MB
- **Allowed Format:** PDF only
- **Storage Location:** `backend/uploads/certificates/`
- **URL Access:** `/uploads/certificates/[filename]`

---

## 🤖 AI Chat Configuration

The AI chatbot uses **Groq SDK** for fast inference. 

**Modes:**
- **Production:** Uses Groq API with real AI responses
- **Mock Mode:** Set `MOCK_AI_CHAT=true` for dummy responses during development

---

## 🎯 Project Pages

- `/` — Main portfolio homepage
- `/admin` — Admin panel (manage certificates, view messages)
- `/upload-certificate` — Redirects to admin panel
- `*` — 404 Not Found page

---

## 🔐 Security Notes

- Email credentials use app-specific passwords, never main passwords
- CORS is configured for specific origins in production
- All file uploads validated (PDF only, size limit)
- MongoDB requires authentication in production
- Sensitive data stored in environment variables

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🆘 Troubleshooting

### Backend won't connect to MongoDB
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB service is running locally, or MongoDB Atlas connection string is correct
- Verify IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)

### AI Chat returns mock responses
- Set `MOCK_AI_CHAT=false` in `.env`
- Verify `GROQ_API_KEY` is valid
- Check Groq API quota/billing status

### Contact form not sending emails
- Verify `BREVO_API_KEY` is valid
- Check `SENDER_EMAIL` and `CONTACT_RECEIVER_EMAIL` are configured
- Ensure email addresses are verified in Brevo

### CORS errors in browser console
- Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`
- Restart backend server

---

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [GitHub Setup Guide](./GITHUB_SETUP.md)

---

## 👨‍💻 About Project Bloom

Project Bloom is a modern portfolio solution for developers and professionals to showcase their work, receive messages, and interact with visitors through an intelligent AI chatbot.

   - Use a Gmail App Password for `EMAIL_PASS`.
   - If `GROQ_API_KEY` is missing or `MOCK_AI_CHAT=true`, the chat endpoint uses mock replies.

4. Start the backend:
   ```bash
   npm run dev
   ```

The backend defaults to `http://localhost:5000`.

## 🔌 API Endpoints

### POST `/api/contact`
Sends contact form email and stores the message in MongoDB.

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I want to work with you!"
}
```

Response:
```json
{
  "success": true
}
```

### GET `/api/certificates`
Returns a list of certificates stored in MongoDB.

### POST `/api/certificates`
Creates a new certificate record.

Request body:
```json
{
  "title": "Certificate Title",
  "event": "Event Name",
  "college": "College Name",
  "location": "Location",
  "description": "Description",
  "fileUrl": "/path/to/certificate.pdf"
}
```

### POST `/api/chat`
Sends a chat message to the AI assistant and stores conversation history.

Request body:
```json
{
  "message": "Tell me about your experience",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "sessionId": "optional-session-id"
}
```

Response:
```json
{
  "success": true,
  "reply": "...",
  "sessionId": "session_1234567890"
}
```

## ✅ Notes

- The AI chatbot is powered by Groq SDK and can fall back to mock responses when the API key is not configured.
- Frontend API calls use `VITE_API_BASE_URL` or default to `http://localhost:5000`.
- Backend stores contact messages, certificates, and chat sessions in MongoDB.

## 📝 Scripts

From the root project:
- `npm run dev` — Start the frontend development server
- `npm run build` — Build the frontend for production
- `npm run preview` — Preview the production build
- `npm run test` — Run Vitest tests

From `backend/`:
- `npm run dev` — Start the backend with nodemon
- `npm start` — Start the backend with Node

## 🔧 Certificate Upload UI
- Admin upload page available at `/upload-certificate`
- Uses `multipart/form-data` to upload PDF certificates to the backend
- Uploaded PDFs are served from `/uploads/certificates`
