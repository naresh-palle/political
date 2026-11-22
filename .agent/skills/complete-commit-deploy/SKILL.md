---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change: run UI automation tests, update skills if needed,
  deploy Cloudflare Pages frontend immediately, deploy Render by updating origin/main, and push git.
  Canonical copy is `.cursor/skills/complete-commit-deploy/SKILL.md`.
---

Follow the canonical copy at `.cursor/skills/complete-commit-deploy/SKILL.md`.

After every code change:
1. Run UI automation tests (`node scripts/run_ui_tests.mjs`).
2. Build frontend (`npm run build` in `frontend/`).
3. Deploy directly to Cloudflare Pages (`leaders-lens` / `https://leaderslensconsulting.com`) via local Wrangler.
4. Deploy Render backend by updating and pushing to `origin/main` (`https://political-ddmj.onrender.com/`).
5. Update skills and rules if the workflow changed.

On every UI change, follow `.cursor/skills/cross-device-ui-parity/SKILL.md`: laptop, desktop, tablet, iPad, and mobile must keep the same alignment and the same information.

Before any new product/UI/role change, follow `.cursor/skills/confirm-before-change/SKILL.md`. That applies to every section and every user.
