---
name: smart-deployment
description: >-
  Target-based deployment protocol for Leader's Lens.
  Automatically deploys Cloudflare Pages (frontend) and Render (backend) upon git push to origin/main.
---

# Smart Deployment Protocol

**Required on every code change.**

1. **Build Verification**: Run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors.
2. **Cloudflare SPA Routing**: Ensure `_redirects` exists in `frontend/public/` and `dist/`.
3. **Continuous Deployment via Git**:
   - Push to `origin main` to trigger:
     - **Cloudflare Pages**: Automatic build and deploy of frontend at `leaders-lens.pages.dev` / `leaderslensconsulting.com`.
     - **Render**: Automatic backend redeploy at `https://political-ddmj.onrender.com/`.

## Target Notes

### Cloudflare Pages (frontend)
- **Triggers**: Changes in `frontend/src/`, `frontend/public/`, `frontend/index.html`, `frontend/package.json`, CSS, UI, layouts.
- **Procedure**: `npm run build` in `frontend/`, verify bundle, push commit to `origin main`.

### Render (backend / MongoDB)
- **Triggers**: Changes in `backend/`, `requirements.txt`, `start.sh`, `build.sh`, `render.yaml`.
- **Procedure**: Push commit to `origin main` to trigger Render auto-deploy.
