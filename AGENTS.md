# Continuous Deployment & Quality Rules

## 0. Confirm before any new change & Preserve Existing Features (required)

Before coding a product, UI, role, routing, or data change, follow `.cursor/skills/confirm-before-change/SKILL.md` and `.cursor/skills/preserve-existing-features/SKILL.md`.

- Under NO circumstances may an existing feature, view, table, metric, filter, button, or workflow be removed, disabled, or broken unless the user EXPLICITLY and unambiguously requests its removal.
- This applies to **every section** and **every user**. Do not add extra features. After a change, other roles and other sections must still be correct.

## 1. Zero Broken Deployments
- Run `npm run build` in `frontend/` before pushing.
- Keep `frontend/public/_redirects` so Cloudflare SPA routing never 404s.
- **Every screen size.** Follow `.cursor/skills/cross-device-ui-parity/SKILL.md`.

## 2. Every code change (required)
Follow `.cursor/skills/complete-commit-deploy/SKILL.md`:

1. Update skills if the workflow changed.
2. Commit and push `origin/main`.
3. Cloudflare builds the frontend from Git (no API token, no GitHub Action).
4. Render deploys the backend from `origin/main`.

Do not leave shippable work only on a feature branch. Do not use GitHub Pages. Do not add a Cloudflare GitHub Actions workflow.

## 3. Production targets
- **Frontend** → Cloudflare Git at https://leaderslensconsulting.com
- **Backend / MongoDB** → Render via `origin/main`
- **Any code change** → git push to `origin/main`
