# Continuous Deployment & Quality Rules

## 0. Confirm before any new change (required)

Before coding a product, UI, role, routing, or data change, follow `.cursor/skills/confirm-before-change/SKILL.md`.

This applies to **every section** and **every user** (admin, political admin, manager, volunteer, officer, SM A, SM M, public, and any later role). Check previous requirements. Ask which users and which screens if that is not already clear. Do not add extra features. After a change, other roles and other sections must still be correct.

## 1. Zero Broken Deployments & UI Automation Testing
- Whenever frontend/UI code changes are made, run the automated UI test suite: `node scripts/run_ui_tests.mjs` (or `npm run test:ui`).
- Run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure `_redirects` exists in `frontend/public/` and `dist/` so Cloudflare Pages SPA routing never shows a 404.
- **Every screen size (required).** Laptop, desktop, tablet, iPad, and mobile must show the same alignment and the same information. Do not hide, drop, or relocate fields on smaller viewports. Follow `.cursor/skills/cross-device-ui-parity/SKILL.md` on every UI / layout / rendered-data change.

## 2. Every code change (required)
Read and follow `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn:

1. Add or update skills if the workflow changed.
2. Run UI automation tests (`node scripts/run_ui_tests.mjs`).
3. Deploy Cloudflare Pages: deploy directly to `leaders-lens` (`https://leaderslensconsulting.com`) via local Wrangler:
   ```powershell
   $env:CLOUDFLARE_ACCOUNT_ID="1b9ccc1557ec43d14cd6980a2aae9089"; $env:CLOUDFLARE_API_KEY="<CLOUDFLARE_API_KEY>"; $env:CLOUDFLARE_EMAIL="npalle.goud@gmail.com"; cd frontend; npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true
   ```
4. Deploy Render by committing and pushing to `origin/main` (https://political-ddmj.onrender.com/).

Do not leave shippable work only on a feature branch.

## 3. Production targets
- **Frontend** → Cloudflare Pages (`leaders-lens.pages.dev` / https://leaderslensconsulting.com)
- **Backend / MongoDB** → Render via `origin/main`
- **Any code change** → UI automation test + Cloudflare Pages deploy + Render deploy + git push.
