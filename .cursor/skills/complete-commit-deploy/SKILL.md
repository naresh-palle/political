---
name: complete-commit-deploy
description: >-
  When implementation is complete, commit to git, publish the frontend to GitHub Pages,
  and deploy the backend to Render. Use after coding, testing, or when the user asks
  to finish, ship, commit, or deploy.
---

# Complete → Commit → GitHub Pages → Render

Run this skill at the end of every implementation that changed the repo. Do not stop at “code is done.” Ship it.

## 1. Finish quality gates

- From `frontend/`: `npm run build` (TypeScript + Vite + `sync_build.js`). Fix errors before committing.
- Confirm `.nojekyll` and `404.html` exist in repo root and `docs/`.
- Run relevant backend tests if `backend/` changed (`PYTHONPATH=<repo> python3 -m pytest backend/tests -n 0`).

## 2. Commit to git

- Stage source, tests, `docs/`, root Pages files (`index.html`, `404.html`, `assets/`, `.nojekyll`, `CNAME`). Do not commit secrets, `.env`, or tokens.
- Skip unrelated dirty files (for example unused `yarn.lock` churn) unless the change required them.
- Commit with a short imperative message that states what shipped.
- Push the current branch: `git push -u origin <branch>`.

## 3. Deploy GitHub Pages (frontend)

Triggers: `frontend/`, `docs/`, root `index.html` / `assets/`, UI, CSS, `frontend/package.json`.

1. `cd frontend && npm run build` (already syncs `dist/` → `docs/` and repo root).
2. `cd frontend && npm run deploy` (`gh-pages -d dist --dotfiles`).
3. Include the synced Pages files in the git commit/push so `main` also serves Pages.

Site: https://leaderslensconsulting.com / GitHub Pages for `naresh-palle/political`.

## 4. Deploy Render (backend / Mongo)

Triggers: `backend/`, `requirements.txt`, `start.sh`, `build.sh`, `render.yaml`, API contracts used by the frontend.

Render auto-deploys **https://political-ddmj.onrender.com/** from **`origin/main`**.

1. Merge or push the backend commit onto `origin/main` (direct push to `main` when that is the agreed production path; otherwise merge the PR then confirm `main` has the commit).
2. Do not treat a feature-branch-only push as a Render deploy.

## 5. Full-stack (default when both layers moved)

1. Build + GitHub Pages deploy.
2. Commit all resulting files.
3. Push/merge **`origin/main`** so Render picks up the API.

## 6. Report

Tell the user: commit SHA, branch, Pages action taken, whether `origin/main` was updated for Render, and that volunteer/officer clients must hard-refresh after Pages publish.
