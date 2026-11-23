---
name: smart-deployment
description: >-
  Push origin/main. Cloudflare Git builds the frontend. Render deploys the backend.
  No Cloudflare API token. No GitHub Actions deploy. GitHub Pages is retired.
---

# Smart Deployment

1. `npm run build` in `frontend/` (or root `npm run build`).
2. Push `origin/main`.
3. Cloudflare publishes https://leaderslensconsulting.com from Git.
4. Render publishes https://political-ddmj.onrender.com/ from `origin/main`.

Do not add GitHub Actions for Cloudflare. Do not request API tokens. Do not use `gh-pages`.
