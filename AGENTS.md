# Continuous Deployment & Quality Rules

## 0. Confirm before any new change & Preserve Existing Features (required)

Before coding a product, UI, role, routing, or data change, follow `.cursor/skills/confirm-before-change/SKILL.md` and `.cursor/skills/preserve-existing-features/SKILL.md`.

- Under NO circumstances may an existing feature, view, table, metric, filter, button, or workflow be removed, disabled, or broken unless the user EXPLICITLY and unambiguously requests its removal.
- This applies to **every section** and **every user** (admin, political admin, manager, volunteer, officer, SM A, SM M, public, and any later role). Check previous requirements. Ask which users and which screens if that is not already clear. Do not add extra features. After a change, other roles and other sections must still be correct.

## 1. Zero Broken Deployments
- Whenever code changes are made, run `npm run build` in `frontend/` to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure `frontend/public/_redirects` exists so Cloudflare Pages SPA routing never shows a 404.
- **Every screen size (required).** Laptop, desktop, tablet, iPad, and mobile must show the same alignment and the same information. Do not hide, drop, or relocate fields on smaller viewports. Follow `.cursor/skills/cross-device-ui-parity/SKILL.md` on every UI / layout / rendered-data change.

## 2. Every code change (required)
Read and follow `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn:

1. Add or update skills if the git / Cloudflare Pages / Render workflow changed.
2. Commit and **push to git**.
3. Deploy Cloudflare Pages from `frontend/`: `npm run build` then `npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true`.
4. Deploy Render by updating `origin/main` (https://political-ddmj.onrender.com/).

Do not leave shippable work only on a feature branch. Do not publish with GitHub Pages (`gh-pages`, `docs/`, repo-root copies).

## 3. Production targets
- **Frontend** → Cloudflare Pages (`leaders-lens`) at https://leaderslensconsulting.com (preview https://leaders-lens.pages.dev)
- **Backend / MongoDB** → Render via `origin/main`
- **Any code change** → git push + Cloudflare Pages + Render unless a target has no shippable artifact (still push git).
