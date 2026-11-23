# Continuous Deployment & Quality Rules

## 0. Confirm before any new change
Follow `.cursor/skills/confirm-before-change/SKILL.md` before coding a product, UI, role, routing, or data change. Applies to **every section and every user**.

## 1. Zero Broken Deployments
- Run `npm run build` in `frontend/` before pushing.
- Ensure `frontend/public/_redirects` exists so Cloudflare Pages SPA routing never 404s.
- **Every screen size.** Laptop, desktop, tablet, iPad, and mobile must show the same alignment and the same information.

## 2. Every code change (required)
Follow `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn:

1. Add or update skills if the git / Cloudflare / Render workflow changed.
2. Deploy frontend to Cloudflare Pages project `leaders-lens` (`https://leaderslensconsulting.com`) with Wrangler Pages.
3. Deploy Render by pushing to `origin/main`.

GitHub Pages is retired. Do not run `gh-pages` or copy the Vite build into `docs/` or the repository root.

## 3. Production targets
- **Frontend** → Cloudflare Pages (`leaders-lens` / https://leaderslensconsulting.com / https://leaders-lens.pages.dev)
- **Backend / MongoDB** → Render via `origin/main` (`https://political-ddmj.onrender.com/`)
- **Any code change** → git push + Cloudflare Pages deploy + Render `origin/main`
