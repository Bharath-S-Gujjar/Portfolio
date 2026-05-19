# Deployment Guide

## Deployment Overview
- **Frontend**: Vercel (Free tier)
- **Backend**: Render (Free tier)
- **Database**: MongoDB Atlas (Free tier)

---

## Phase 1: Prepare Backend for Render

### Step 1: Create MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and sign in
3. Click "Create" to create a new project
4. Select "Build a Database" → Choose "Free" tier
5. Select region (closest to you)
6. Create a cluster (takes 2-3 minutes)
7. Create database user:
   - Username: `portfolio-admin` (or your choice)
   - Password: Generate a strong password
8. Get connection string:
   - Click "Connect" → "Drivers"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your credentials
   - Save this URL (you'll need it)

### Step 2: Update Backend Environment Variables
Create/update `backend/.env` with:
```
PORT=5000
MONGODB_URI=mongodb+srv://portfolio-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GROQ_API_KEY=your-groq-api-key
MOCK_AI_CHAT=false
FRONTEND_URL=https://your-vercel-url.vercel.app
ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
NODE_ENV=production
```

**Important for Gmail:**
- Enable 2FA on your Gmail account
- Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
- Create an app password and use it in EMAIL_PASS

### Step 3: Update Backend CORS Configuration
Edit `backend/server.js` to use environment variables for CORS:

Find the line:
```javascript
app.use(cors());
```

Replace with:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
```

### Step 4: Add Render Configuration
Create `backend/render.yaml`:
```yaml
services:
  - type: web
    name: portfolio-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        value: ${MONGODB_URI}
      - key: EMAIL_USER
        value: ${EMAIL_USER}
      - key: EMAIL_PASS
        value: ${EMAIL_PASS}
      - key: GROQ_API_KEY
        value: ${GROQ_API_KEY}
      - key: FRONTEND_URL
        value: ${FRONTEND_URL}
      - key: ALLOWED_ORIGINS
        value: ${ALLOWED_ORIGINS}
      - key: NODE_ENV
        value: production
```

---

## Phase 2: Deploy Backend to Render

### Step 1: Push to GitHub
```bash
# From root directory
git init
git add .
git commit -m "Initial commit - ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account & Deploy
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `portfolio-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables on Render
1. Go to your deployed service
2. Click "Environment" in the left sidebar
3. Add all variables from your `.env` file:
   - MONGODB_URI
   - EMAIL_USER
   - EMAIL_PASS
   - GROQ_API_KEY
   - FRONTEND_URL
   - ALLOWED_ORIGINS
   - NODE_ENV=production

4. Click "Save Changes" to redeploy

### Step 4: Get Backend URL
- Once deployed, Render gives you a URL like: `https://portfolio-backend-xxxxx.onrender.com`
- Save this URL - you'll need it for the frontend

**Note**: Free tier on Render spins down after 15 min of inactivity. First request takes 30 seconds to wake up.

---

## Phase 3: Prepare Frontend for Vercel

### Step 1: Update API Configuration
Edit `src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // Add authorization header with token if needed
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  chat: {
    async send(message: string, sessionId?: string) {
      return this.request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, sessionId }),
      });
    },
  },
  
  contact: {
    async send(data: { name: string; email: string; message: string }) {
      return this.request('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
  
  certificates: {
    async upload(formData: FormData) {
      return fetch(`${API_BASE_URL}/api/certificates/upload`, {
        method: 'POST',
        body: formData,
      }).then(r => r.json());
    },
    
    async getAll() {
      return this.request('/api/certificates');
    },
  },
  
  projects: {
    async getAll() {
      return this.request('/api/projects');
    },
  },
};
```

### Step 2: Create `.env.production` (Frontend)
Create at root level:
```
VITE_API_URL=https://portfolio-backend-xxxxx.onrender.com
```

### Step 3: Update `vite.config.ts` for Production
Replace the proxy section with:
```typescript
server: {
  host: "::",
  port: 8080,
  hmr: {
    overlay: false,
  },
  proxy: process.env.NODE_ENV !== 'production' ? {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  } : undefined,
},
```

### Step 4: Create `vercel.json`
Create at root level:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  },
  "redirects": [
    {
      "source": "/api/:path*",
      "destination": "https://portfolio-backend-xxxxx.onrender.com/api/:path*"
    }
  ]
}
```

---

## Phase 4: Deploy Frontend to Vercel

### Step 1: Build Locally (Test)
```bash
npm run build
npm run preview
```

### Step 2: Push to GitHub (if not already pushed)
```bash
git add .
git commit -m "Frontend configuration for deployment"
git push origin main
```

### Step 3: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Framework: Select "Vite"
6. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Add Environment Variables
1. Go to Settings → Environment Variables
2. Add:
   - `VITE_API_URL`: `https://portfolio-backend-xxxxx.onrender.com`

3. Click "Save"
4. Redeploy: Go to Deployments → Click "Redeploy"

### Step 5: Get Frontend URL
- Your frontend URL: `https://your-project-name.vercel.app`

---

## Phase 5: Final Configuration

### Update Backend with Frontend URL
1. Go to Render dashboard
2. Navigate to your backend service
3. Update Environment Variables:
   - `FRONTEND_URL`: `https://your-project-name.vercel.app`
   - `ALLOWED_ORIGINS`: `https://your-project-name.vercel.app`

4. Click "Save" to trigger redeployment

### Test Everything
1. Visit: `https://your-project-name.vercel.app`
2. Test:
   - Chat functionality
   - Contact form
   - Certificate upload (if admin)
   - Projects section

---

## Troubleshooting

### "Network Error" when calling API
- Check backend is deployed and running on Render
- Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` in backend `.env`
- Check CORS headers in browser DevTools (F12 → Network tab)

### "MongoDB Connection Error"
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist includes Render's IPs (or allow all: 0.0.0.0/0)

### "Email not sending"
- Verify Gmail app password (not regular password)
- Check 2FA is enabled on Gmail

### Frontend showing old code
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear cache in Vercel: Settings → Deployments → Redeploy

### Backend waking up slowly
- Free tier on Render takes 30 seconds first request
- Consider upgrading to Starter plan ($7/month) for better performance

---

## Optional: Database Backup

### MongoDB Atlas Backup
1. Go to MongoDB Atlas → Cluster → Backup
2. Enable "Automatic Backup"
3. Set retention (default 7 days is fine for free tier)

---

## Next Steps for Production
- Add custom domain (on both Vercel and Render)
- Set up CI/CD pipeline
- Add monitoring/alerts
- Upgrade to paid tiers if needed (Vercel Pro, Render paid plans)
