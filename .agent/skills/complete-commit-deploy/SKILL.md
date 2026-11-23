---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change: update skills if needed, commit, push git,
  deploy Cloudflare Pages, deploy Render. Canonical copy is
  `.cursor/skills/complete-commit-deploy/SKILL.md`. GitHub Pages is retired.
---

Follow the canonical copy at `.cursor/skills/complete-commit-deploy/SKILL.md`.

After every code change: add/update skills if the workflow changed, push to git, deploy Cloudflare Pages (`npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true` from `frontend/` after `npm run build`), and deploy Render by updating `origin/main`.

Do not publish with `gh-pages` or copy builds into `docs/` / the repo root.

On every UI change, follow `.cursor/skills/cross-device-ui-parity/SKILL.md`.

Before any new product/UI/role change, follow `.cursor/skills/confirm-before-change/SKILL.md`.
