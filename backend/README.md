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

3. Create a `.env` file with your MongoDB connection string, allowed frontend URL, Brevo credentials, and optional Cloudinary/Groq keys:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   PUBLIC_API_URL=http://localhost:5000
   BREVO_API_KEY=your-brevo-api-key
   SENDER_EMAIL=verified-sender@example.com
   CONTACT_RECEIVER_EMAIL=receiver@example.com
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   GROQ_API_KEY=your-groq-api-key
   ADMIN_PASSWORD=change-this-password
   TOKEN_SECRET=change-this-long-random-secret
   PORT=5000
   MOCK_AI_CHAT=false
   ```

   **Important Notes:** 
   - `FRONTEND_URL` and `ALLOWED_ORIGINS` must contain exact frontend origins. Do not use `*`.
   - Configure `MONGODB_URI` for your MongoDB database. `MONGO_URI` is also accepted for local compatibility.
   - Set Cloudinary variables in production. Render local disk uploads are temporary and can disappear after redeploys or instance restarts.
   - `PUBLIC_API_URL` should be your deployed Render backend URL in production.
   - Get a Groq API key from the provider you're using.
   - If `GROQ_API_KEY` is missing or `MOCK_AI_CHAT=true`, the chat endpoint uses mock replies

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

### POST /api/certificates/upload
Uploads a certificate PDF file and creates a certificate record.

**Form fields:**
- `title`
- `event`
- `college`
- `location`
- `description`
- `certificate` (PDF file)

**Response:**
```json
{
  "success": true,
  "certificate": {
    "_id": "...",
    "title": "Certificate Title",
    "event": "Event Name",
    "college": "College Name",
    "location": "Location",
    "description": "Description",
    "fileUrl": "https://your-backend.onrender.com/uploads/certificates/1690000000000-certificate.pdf",
    "date": "2026-05-18"
  }
}
```

### POST /api/chat
AI chat endpoint with Groq integration and conversation history storage.

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "reply": "I'm Bharath, a full-stack developer with expertise in React, Node.js...",
  "sessionId": "session_1234567890"
}
```

### GET /api/chat/:sessionId
Returns the stored chat session and message history for a given session ID.

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890",
    "messages": [
      { "role": "user", "content": "Hi" },
      { "role": "assistant", "content": "Hello!" }
    ],
    "createdAt": "2026-05-18T...",
    "updatedAt": "2026-05-18T..."
  }
}
```

**Features:**
- Groq-based chat integration with conversation history
- Conversation history persistence in MongoDB
- Session tracking for multi-turn conversations
- Context-aware responses about Bharath's experience and projects


## Features Implemented
- ✅ Contact API with nodemailer Gmail integration
- ✅ Certificates API with MongoDB persistence
- ✅ AI Chat API endpoint with message history and mock fallback support
