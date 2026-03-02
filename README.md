# YouTube Analytics Dashboard

A React-based YouTube Analytics dashboard built with Vite and Recharts.

## Deploy to Railway

### Step 1: Push to GitHub

```bash
cd youtube-dashboard
git init
git add .
git commit -m "Initial commit - YouTube Analytics Dashboard"
```

Create a new repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/youtube-dashboard.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.com](https://railway.com) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub Repo"**
4. Choose your `youtube-dashboard` repository
5. Railway will auto-detect the Dockerfile and start building
6. Once deployed, click **"Generate Domain"** in Settings to get your public URL

That's it! Your dashboard will be live.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
