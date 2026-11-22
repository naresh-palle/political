---
name: smart-deployment
description: >-
  Target-based deployment protocol for Leader's Lens.
  Runs UI automation tests, builds frontend, deploys directly to Cloudflare Pages (frontend),
  and deploys Render (backend) upon git push to origin/main.
---

# Smart Deployment Protocol

**Required on every code change.**

1. **UI Automation Testing**: Run `node scripts/run_ui_tests.mjs` (or `npm run test:ui`) across viewports (Desktop, Laptop, Tablet, Mobile) before deployment.
2. **Build Verification**: Run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors.
3. **Cloudflare SPA Routing**: Ensure `_redirects` exists in `frontend/public/` and `dist/`.
4. **Target Deployments**:
   - **Frontend (Cloudflare Pages)**: Deploy directly via Wrangler to `leaders-lens` / `https://leaderslensconsulting.com`:
     ```powershell
     $env:CLOUDFLARE_ACCOUNT_ID="1b9ccc1557ec43d14cd6980a2aae9089"; $env:CLOUDFLARE_API_KEY="<CLOUDFLARE_API_KEY>"; $env:CLOUDFLARE_EMAIL="npalle.goud@gmail.com"; cd frontend; npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true
     ```
   - **Backend / Database (Render)**: Push to `origin/main` to trigger automated backend redeploy at `https://political-ddmj.onrender.com/`.

## Target Notes

### Cloudflare Pages (Frontend)
- **Triggers**: Changes in `frontend/src/`, `frontend/public/`, `frontend/index.html`, CSS, UI, layouts, assets.
- **Procedure**: Run UI automation test, build in `frontend/`, deploy directly via Wrangler, push commit to `origin/main`.

### Render (Backend / MongoDB)
- **Triggers**: Changes in `backend/`, `requirements.txt`, `start.sh`, `build.sh`, `render.yaml`.
- **Procedure**: Test Python syntax, push commit to `origin/main` to trigger Render auto-deploy.
