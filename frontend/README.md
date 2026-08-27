# AutoFixer AI — Frontend (Vite + React + TypeScript)

This is the web dashboard for AutoFixer AI, providing real-time WebSocket event streaming, monospace terminal logs, visual git diffs, agent reflection cards, and downloadable post-mortem audit reports.

---

## 🚀 Deploying to Vercel

### Option 1: Vercel Web Dashboard (Recommended)

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New..." → "Project"**.
3. Import your GitHub repository (`autofixer-ai`).
4. In the **Project Settings**:
   - **Root Directory**: Click **Edit** and choose `frontend` (⚠️ **Crucial Step**).
   - **Framework Preset**: `Vite` (auto-detected).
   - **Build Command**: `npm run build` (auto-detected).
   - **Output Directory**: `dist` (auto-detected).
5. In **Environment Variables**, add:
   - `VITE_API_URL`: The URL of your deployed FastAPI backend (e.g., `https://autofixer-api.onrender.com`).
6. Click **Deploy**!

---

### Option 2: Vercel CLI

```bash
cd frontend
npx vercel
```

Follow the prompts:
- **Set up and deploy?**: `y`
- **Which scope?**: Choose your personal/team account.
- **Link to existing project?**: `n`
- **Project name**: `autofixer-ai-dashboard`
- **In which directory is your code located?**: `./`
- **Want to modify build settings?**: `n`

To set the production environment variable:
```bash
npx vercel env add VITE_API_URL production
# Enter your backend URL when prompted, e.g. https://autofixer-api.onrender.com
npx vercel --prod
```

---

## ⚙️ Backend Connectivity & Dynamic Switching

The dashboard connects to the AutoFixer FastAPI backend via REST API and WebSockets:
- **Build Time**: Set `VITE_API_URL` in Vercel environment variables.
- **Runtime / Dynamic**: Users can click the **⚙️ Settings** icon in the dashboard header to connect to any backend URL at runtime (saved in local storage).

