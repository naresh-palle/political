---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change. Run UI automation tests, update skills if the workflow changed,
  commit, push to git, deploy Cloudflare Pages frontend immediately, and deploy Render via origin/main.
  Use whenever files change, and when the user asks to finish, ship, commit, or deploy.
---

# Every code change → UI test → skills → Cloudflare Pages deploy → Render deploy → git push

Do this in the **same turn** as the code change. Do not stop at “code is done.”
Do not wait for the user to ask. Feature-branch-only work is not deployed.

## 0. Add / update skills

If this change affects how we ship (git, Cloudflare Pages, Render, quality gates), update:

- `.cursor/skills/complete-commit-deploy/SKILL.md` (canonical)
- `.agent/skills/complete-commit-deploy/SKILL.md` (pointer)
- `.agent/skills/smart-deployment/SKILL.md`
- `.agent/rules/deployment-rules.md`
- `AGENTS.md`

If this change affects screens, layout, or rendered fields, also follow `.cursor/skills/cross-device-ui-parity/SKILL.md` (and its `.agent/skills/cross-device-ui-parity/` pointer).

Before implementing a **new** product, UI, role, routing, or data change, follow `.cursor/skills/confirm-before-change/SKILL.md` (and its `.agent/skills/confirm-before-change/` pointer). That gate applies to **every section and every user**, not one module.

Keep those files in the same commit as the related code when the workflow itself changed.

## 1. Quality gates & UI Automation Testing

- **UI Automation Testing (REQUIRED on frontend/UI changes):**
  Run `node scripts/run_ui_tests.mjs` (or `npm run test:ui`) to verify UI integrity, functional flows, zero mock/hardcoded values, and cross-device parity.
- **Frontend Build:**
  From `frontend/`: `npm run build` (TypeScript compilation + Vite bundle + `sync_build.js`). Fix any errors before committing.
- Ensure `_redirects` exists in `frontend/public/` and `frontend/dist/` for Cloudflare Pages SPA routing.
- **Backend Quality Gate (if `backend/` changed):**
  Verify Python syntax and tests (`py -c "from services import pi_api; ..."` or `pytest`).
- **Every screen size (required):**
  Laptop, desktop, tablet, iPad, and mobile must show the **same alignment** and the **same information**. Do not hide fields on smaller viewports. Verified via UI automation tests.

## 2. Deploy Cloudflare Pages (Frontend)

Production Site: **https://leaderslensconsulting.com** (Cloudflare Pages project: `leaders-lens` / `leaders-lens.pages.dev`).

Whenever frontend files change, deploy immediately using local Wrangler with configured credentials:
```powershell
$env:CLOUDFLARE_ACCOUNT_ID="1b9ccc1557ec43d14cd6980a2aae9089"; $env:CLOUDFLARE_API_KEY="<CLOUDFLARE_API_KEY>"; $env:CLOUDFLARE_EMAIL="npalle.goud@gmail.com"; cd frontend; npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true
```
This guarantees instant edge deployment in seconds without waiting for GitHub Actions or external token refresh.

## 3. Deploy Render & Git Push (Backend / Full-Stack)

Render auto-deploys **https://political-ddmj.onrender.com/** from **`origin/main`**.

1. Stage all changes: source, tests, `docs/`, root distribution files (`index.html`, `404.html`, `assets/`, `CNAME`), and skill/rule files.
2. Commit with a clean imperative conventional commit message.
3. Push to git: `git push origin main`.
4. Render immediately pulls `origin/main` and updates the backend API and MongoDB connections.

## 4. Single-Command Smart Deployment

You can execute the entire verified pipeline automatically at any time by running:
```bash
node scripts/smart_deploy.js
```

## 5. Report to User

Tell the user:
- UI Automation Test results (test pass count, viewports verified)
- Cloudflare Pages deployment outcome and URL
- Render backend deployment status via `origin/main`
- Commit SHA and branch pushed to GitHub
