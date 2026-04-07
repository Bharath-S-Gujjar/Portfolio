# Portfolio Website - Project Bloom

A modern, responsive portfolio website built with React, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

### Frontend (Complete ✅)
- Modern React + TypeScript setup
- Beautiful UI with Tailwind CSS and shadcn/ui components
- Smooth animations with Framer Motion
- Responsive design
- Contact form with validation
- Projects showcase
- Skills section
- Achievements section
- AI Chatbot component

### Backend (In Progress 🔄)
- ✅ Contact API - Send emails via nodemailer
- ✅ Certificates API - Basic CRUD operations (in-memory)
- ✅ AI Chat API - Placeholder implementation
- 🔄 Database integration (MongoDB/PostgreSQL)
- 🔄 Authentication for admin panel

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

### Backend
- Node.js
- Express.js
- nodemailer (Gmail SMTP)
- CORS
- dotenv

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:8080](http://localhost:8080)

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=5000
   ```

   **Note:** Use Gmail App Password for EMAIL_PASS

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on [http://localhost:5000](http://localhost:5000)

## 📧 Contact API

The contact form sends emails using nodemailer with Gmail SMTP.

**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I want to work with you!"
}
```

**Response:**
```json
{
  "success": true
}
```

## 🔄 Next Steps

1. **Certificates API**: Implement CRUD operations for certificates backed by MongoDB
2. **AI Chat API**: Integrate with OpenAI or similar for portfolio Q&A
3. **Database**: Add MongoDB for data persistence and contact storage
4. **Deployment**: Deploy frontend and backend separately
5. **Authentication**: Add admin panel for managing content

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
