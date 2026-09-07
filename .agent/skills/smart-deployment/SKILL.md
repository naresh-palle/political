---
name: smart-deployment
description: >-
  After every code change, commit, push git, deploy GitHub Pages, and deploy
  Render via origin/main. Also run complete-commit-deploy. Use on any frontend,
  backend, or full-stack edit.
---

# Smart Deployment Protocol

**Required on every code change.** Run `.cursor/skills/complete-commit-deploy/SKILL.md` in the same turn: update skills if the ship workflow changed, commit, push git, GitHub Pages, Render.

If this protocol itself changes, update this file plus the complete-commit-deploy skill, `AGENTS.md`, and `.agent/rules/deployment-rules.md`.

## Always ship both production targets

Do not leave work only on a feature branch.

1. **Git** — commit and `git push -u origin <branch>`. Open or update the PR.
2. **GitHub Pages** — `cd frontend && npm run build && npm run deploy`.
   Site: https://leaderslensconsulting.com
3. **Render** — update **`origin/main`** so https://political-ddmj.onrender.com/ auto-deploys.

## Target notes

### GitHub Pages (frontend)

- **Triggers**: `frontend/src/`, `frontend/public/`, `frontend/index.html`, `frontend/package.json`, `docs/`, CSS, UI, layouts, or a production Pages sync.
- **Procedure**: `npm run build` in `frontend/` (syncs `dist/` → root and `docs/` with `.nojekyll`), then `npm run deploy` (`gh-pages`). Commit synced Pages files and push.

### Render (backend / Mongo)

- **Triggers**: `backend/`, `requirements.txt`, `start.sh`, `build.sh`, `render.yaml`, API contracts, seed JSON used by the API.
- **Procedure**: commit, then move the commit to `origin/main`. A branch-only push does not deploy Render.

### Full-stack or mixed turns

Run Pages **and** Render. Default when both layers moved, and also when the user asked to always deploy both.
