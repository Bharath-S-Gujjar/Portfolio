# 🚀 Quick Deployment Checklist

## Pre-Deployment Checklist

### 1. Backend Setup ✓
- [ ] Create MongoDB Atlas account & database
- [ ] Get MongoDB connection string
- [ ] Set up Gmail app password (for emails)
- [ ] Get Groq API key (for AI chat)
- [ ] Copy `.env.example` to `backend/.env`
- [ ] Fill in all environment variables in `backend/.env`
- [ ] Test locally: `npm run dev` (from backend folder)
- [ ] Push all changes to GitHub

### 2. Frontend Setup ✓
- [ ] Verify `src/lib/api.ts` exists and uses `VITE_API_BASE_URL`
- [ ] Test locally: `npm run dev` (from root)
- [ ] Build test: `npm run build`
- [ ] Push all changes to GitHub

---

## Deployment Steps (10 minutes each)

### Backend (Render)
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create new Web Service
4. Connect your GitHub repo
5. Add environment variables:
   - MONGODB_URI
   - EMAIL_USER
   - EMAIL_PASS
   - GROQ_API_KEY
   - FRONTEND_URL
   - ALLOWED_ORIGINS
   - NODE_ENV=production
6. Deploy
7. **Copy the backend URL** (e.g., `https://portfolio-backend-xxxxx.onrender.com`)

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Add environment variable:
   - VITE_API_BASE_URL=`https://portfolio-backend-xxxxx.onrender.com`
5. Deploy
6. **Copy the frontend URL** (e.g., `https://portfolio.vercel.app`)

### Final Step: Update Backend
1. Go back to Render backend settings
2. Update FRONTEND_URL and ALLOWED_ORIGINS with Vercel URL
3. Redeploy

---

## Testing After Deployment

- [ ] Visit frontend URL: `https://portfolio.vercel.app`
- [ ] Test Chat - should connect to backend
- [ ] Test Contact Form - should send email
- [ ] Check browser Console (F12) for errors
- [ ] Test on mobile (responsive)

---

## Useful Links

| Service | Link | What to Do |
|---------|------|-----------|
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas | Create database |
| Render | https://render.com | Deploy backend |
| Vercel | https://vercel.com | Deploy frontend |
| Google App Passwords | https://myaccount.google.com/apppasswords | Get email password |
| Groq API | https://console.groq.com | Get API key |

---

## Environment Variables Summary

### Backend (Render)
```
MONGODB_URI=mongodb+srv://...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GROQ_API_KEY=your-key
FRONTEND_URL=https://portfolio.vercel.app
ALLOWED_ORIGINS=https://portfolio.vercel.app
NODE_ENV=production
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://portfolio-backend-xxxxx.onrender.com
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check ALLOWED_ORIGINS in Render settings |
| "Email not sending" | Verify Gmail app password & 2FA enabled |
| "Chat not working" | Check Groq API key is set correctly |
| "Page shows old version" | Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac) |
| "Backend slow on first load" | Free tier Render wakes up in ~30 seconds |

---

## Command Reference

```bash
# Local Development
npm run dev              # Start frontend
npm run dev              # Start backend (from backend folder)

# Build for Production
npm run build            # Build frontend
npm run preview          # Preview production build locally

# Check Environment
echo $VITE_API_BASE_URL  # Check frontend API URL
cat backend/.env         # Check backend variables
```

---

## Next Steps After Deployment
- [ ] Add custom domain (optional)
- [ ] Set up auto-deploys from GitHub
- [ ] Monitor errors with Sentry or LogRocket
- [ ] Set up database backups
- [ ] Upgrade plans if needed for better performance
