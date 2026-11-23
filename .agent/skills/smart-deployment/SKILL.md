---
name: smart-deployment
description: >-
  Target-based deployment for Leaders Lens. Frontend goes to Cloudflare Pages.
  Backend goes to Render via origin/main. GitHub Pages is retired.
---

# Smart Deployment Protocol

**Required on every code change.** Follow `.cursor/skills/complete-commit-deploy/SKILL.md`.

1. **Build**: `npm run build` in `frontend/`.
2. **Cloudflare SPA routing**: `frontend/public/_redirects` must exist; `sync_build.js` writes it into `frontend/dist/`.
3. **Frontend (Cloudflare Pages)**: from `frontend/`, after a successful build:

```bash
npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true
```

Production: https://leaderslensconsulting.com  
Preview: https://leaders-lens.pages.dev  
Account: `1b9ccc1557ec43d14cd6980a2aae9089`

4. **Backend (Render)**: push to `origin/main` → https://political-ddmj.onrender.com/

Do not use GitHub Pages, `gh-pages`, or `wrangler deploy` (Workers) for the frontend.
