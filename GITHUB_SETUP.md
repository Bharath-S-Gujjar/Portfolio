# 📦 GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign up/login
2. Click "+" (top right) → "New repository"
3. Name: `portfolio` (or your preferred name)
4. Description: "Full-stack portfolio website with React, Node.js, and MongoDB"
5. Choose "Public" (free tier)
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Get Your Repository URL

Copy the repository URL from GitHub (looks like):
```
https://github.com/YOUR_USERNAME/portfolio.git
```

## Step 3: Initialize Git & Push Code

Open PowerShell in your portfolio root directory and run:

```powershell
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Full-stack portfolio with React, Node.js, MongoDB"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git

# Rename branch to main (GitHub default)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Create .gitignore (if not exists)

Create a `.gitignore` file in the root directory with:

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.*.local
backend/.env

# Build outputs
dist/
build/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/

# Uploads (don't commit user uploads)
backend/uploads/
backend/public/

# Build
tsconfig.tsbuildinfo

# Misc
.cache/
dist-ssr/
*.local
```

**Important**: Make sure you NEVER push `.env` files to GitHub!

```powershell
# If you accidentally committed .env, remove it from git tracking:
git rm --cached backend/.env
git commit -m "Remove .env from tracking"
```

## Step 5: Configure GitHub for Deployments

### For Render (Backend)
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (authorize it)
3. Create new Web Service → "Connect my own"
4. Select your portfolio repository
5. Render will auto-detect `backend/` folder

### For Vercel (Frontend)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (authorize it)
3. Click "Import Project"
4. Select your portfolio repository
5. Vercel will auto-detect it's a Vite project

---

## Useful Git Commands

```powershell
# Check git status
git status

# View commit history
git log --oneline -n 10

# Push to GitHub
git push origin main

# Pull latest from GitHub
git pull origin main

# Create a new branch (for features)
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge a branch
git merge feature/new-feature

# Delete a branch
git branch -d feature/new-feature
```

---

## Troubleshooting

### "Permission denied" error
- Make sure SSH key is set up or use HTTPS URL instead
- Go to GitHub → Settings → SSH and GPG keys → Add your SSH key

### ".env was committed to GitHub"
- Go to GitHub → Settings → Secrets and variables
- Add secrets there instead of committing them

### "Need to push but have local changes"
```powershell
git add .
git commit -m "Your commit message"
git push origin main
```

### "Repository not found"
- Check URL is correct: `git remote -v`
- Fix it: `git remote set-url origin https://github.com/YOUR_USERNAME/portfolio.git`

---

## After First Push

Your repository will be visible at:
```
https://github.com/YOUR_USERNAME/portfolio
```

Both Render and Vercel will automatically deploy when you push to `main` branch! 🎉
