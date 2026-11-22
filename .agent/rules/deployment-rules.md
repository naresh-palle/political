# Continuous Deployment & Quality Rules

## 0. Confirm before any new change
Follow `.cursor/skills/confirm-before-change/SKILL.md` before coding a product, UI, role, routing, or data change. Applies to **every section and every user**, not only SM A. Check prior requirements, ask if users/screens are unclear, and do not add extra features.

## 1. Zero Broken Deployments & UI Testing
- Whenever code changes are made, run UI automation tests: `node scripts/run_ui_tests.mjs` (or `npm run test:ui`).
- Run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure `_redirects` exists in `frontend/public/` and `dist/` so Cloudflare Pages SPA routing never shows a 404.
- **Every screen size (required).** Laptop, desktop, tablet, iPad, and mobile must show the same alignment and the same information. Do not hide fields on smaller viewports. Follow `.cursor/skills/cross-device-ui-parity/SKILL.md` on every UI change.

## 2. Every code change (required)
Follow `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn:

1. Add or update skills if the git / Cloudflare / Render workflow changed.
2. Run UI automation tests.
3. Deploy frontend to Cloudflare Pages (`leaders-lens` / `https://leaderslensconsulting.com`) via local Wrangler.
4. Deploy Render backend and sync GitHub by pushing to `origin/main`.

## 3. Production targets
- **Frontend** → Cloudflare Pages (`leaders-lens` / `https://leaderslensconsulting.com`).
- **Backend / MongoDB** → Render via `origin/main` (`https://political-ddmj.onrender.com/`).
- **Any code change** → UI automation test + Cloudflare Pages deploy + Render deploy + git push.
