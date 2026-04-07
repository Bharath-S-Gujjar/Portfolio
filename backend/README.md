# Portfolio Backend

Express.js backend for the portfolio website with contact form functionality.

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gmail credentials and MongoDB connection string:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
   PORT=5000
   ```

   **Important:** For Gmail, you need to use an App Password, not your regular password. Generate one at https://myaccount.google.com/apppasswords

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/contact
Sends a contact message via email.

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

### GET /api/certificates
Fetches all certificates.

**Response:**
```json
[
  {
    "_id": "1",
    "title": "Full Stack Development",
    "event": "Web Development Bootcamp",
    "college": "Tech University",
    "location": "Bangalore, India",
    "description": "Completed intensive full-stack development course...",
    "fileUrl": "/certificates/fullstack.pdf",
    "date": "2024-01-15"
  }
]
```

### POST /api/certificates
Creates a new certificate.

**Request Body:**
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

### POST /api/chat
AI chat endpoint (placeholder implementation).

**Request Body:**
```json
{
  "message": "Tell me about yourself",
  "history": []
}
```

**Response:**
```json
{
  "success": true,
  "reply": "I'm Bharath, a passionate full-stack developer..."
}
```

### GET /api/health
Health check endpoint.

## Features Implemented
- ✅ Contact API with nodemailer Gmail integration
- 🔄 Certificates API (coming soon)
- 🔄 AI Chat API (coming soon)