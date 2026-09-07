# Continuous Deployment & Quality Rules

## 1. Zero Broken Deployments
- Whenever code changes are made, run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure `.nojekyll` and `404.html` exist in `docs/` and root `.` so GitHub Pages routing never shows a 404.

## 2. Selective & Targeted Deployment
- **Frontend Changes** -> Deploy to GitHub Pages (gh-pages, `docs/`, root).
- **Backend / MongoDB Changes** -> Deploy to Render via `origin/main`.
- **Full-Stack Changes** -> Execute both deployment pipelines.

## 3. When code is complete (required)
Read and follow `.cursor/skills/complete-commit-deploy/SKILL.md`:

1. Commit finished work to git and push the branch.
2. Deploy the frontend to GitHub Pages (`npm run build` then `npm run deploy` in `frontend/`).
3. Deploy the backend to Render by updating `origin/main` (https://political-ddmj.onrender.com/).
