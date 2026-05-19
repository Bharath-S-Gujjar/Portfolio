# Portfolio Website - Project Bloom

A modern, responsive portfolio website built with React, TypeScript, Tailwind CSS, Framer Motion, and a connected Express backend.

## 🚀 Current Status

### Frontend
- ✅ React + TypeScript with Vite
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Responsive portfolio layout
- ✅ Animated UI with Framer Motion
- ✅ Contact form with validation
- ✅ Projects showcase
- ✅ Skills and achievements sections
- ✅ Floating AI chatbot component
- ✅ Backend API integration via `src/lib/api.ts`

### Backend
- ✅ Express server in `backend/server.js`
- ✅ Contact API with Gmail SMTP via nodemailer
- ✅ Certificate API with MongoDB persistence
- ✅ Certificate PDF upload support via `POST /api/certificates/upload`
- ✅ AI chat endpoint with Groq SDK integration and message history
- ✅ MongoDB data storage for contacts, certificates, and chat sessions
- ✅ Optional mock AI chat mode via `MOCK_AI_CHAT=true`

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- shadcn/ui
- React Router
- React Hook Form
- lucide-react
- @tanstack/react-query
- zod

### Backend
- Node.js
- Express
- Mongoose
- nodemailer
- dotenv
- cors
- groq-sdk

## 📁 Project Structure

- `src/` — React application
- `src/components/AIChatbot.tsx` — floating chatbot UI
- `src/lib/api.ts` — frontend API client
- `backend/server.js` — Express backend
- `backend/models/` — Mongoose models

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- MongoDB accessible locally or remotely

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the frontend:
   ```bash
   npm run dev
   ```

3. Open the local URL shown by Vite.

> If you need to use a different backend URL, set `VITE_API_BASE_URL` in your environment or `.env` file.

### Backend Setup
1. Go to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following keys:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
   GROQ_API_KEY=your-groq-api-key
   PORT=5000
   MOCK_AI_CHAT=false
   ```

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
