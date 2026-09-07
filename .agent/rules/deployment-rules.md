# Continuous Deployment & Quality Rules

## 1. Zero Broken Deployments
- Whenever code changes are made, run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure `.nojekyll` and `404.html` exist in `docs/` and root `.` so GitHub Pages routing never shows a 404.

## 2. Every code change (required)
Follow `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn:

1. Add or update skills if the git / Pages / Render workflow changed.
2. Commit and push to git.
3. Deploy GitHub Pages (`npm run build` then `npm run deploy` in `frontend/`).
4. Deploy Render by updating `origin/main`.

## 3. Production targets
- **Frontend** → GitHub Pages (`gh-pages`, `docs/`, root).
- **Backend / MongoDB** → Render via `origin/main`.
- **Any code change** → git push + GitHub Pages + Render.
