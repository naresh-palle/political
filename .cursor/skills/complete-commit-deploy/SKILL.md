---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change. Update skills if the workflow changed,
  commit, push to git, deploy GitHub Pages, and deploy Render via origin/main.
  Use whenever files change, and when the user asks to finish, ship, commit, or deploy.
---

# Every code change → skills → git push → GitHub Pages → Render

Do this in the **same turn** as the code change. Do not stop at “code is done.”
Do not wait for the user to ask. Feature-branch-only work is not deployed.

## 0. Add / update skills

If this change affects how we ship (git, Pages, Render, quality gates), update:

- `.cursor/skills/complete-commit-deploy/SKILL.md` (canonical)
- `.agent/skills/complete-commit-deploy/SKILL.md` (pointer)
- `.agent/skills/smart-deployment/SKILL.md`
- `.agent/rules/deployment-rules.md`
- `AGENTS.md`

Keep those files in the same commit as the related code when the workflow itself changed.

## 1. Quality gates

- From `frontend/`: `npm run build` (TypeScript + Vite + `sync_build.js`). Fix errors before committing.
- Confirm `.nojekyll` and `404.html` exist in repo root and `docs/`.
- If `backend/` changed: `PYTHONPATH=<repo> python3 -m pytest backend/tests -n 0`.

## 2. Commit and push git

- Stage source, tests, `docs/`, root Pages files (`index.html`, `404.html`, `assets/`, `.nojekyll`, `CNAME`), and skill/rule files.
- Do not commit secrets, `.env`, or tokens.
- Skip unrelated dirty files (for example unused `yarn.lock` churn) unless the change required them.
- Commit with a short imperative message that states what shipped.
- Push the working branch: `git push -u origin <branch-name>`.
- Create or update the pull request for that branch.

## 3. Deploy GitHub Pages (always when the turn produced a shippable commit)

Site: https://leaderslensconsulting.com (GitHub Pages for `naresh-palle/political`).

1. `cd frontend && npm run build` (syncs `dist/` → `docs/` and repo root).
2. `cd frontend && npm run deploy` (`gh-pages -d dist --dotfiles`).
3. Commit and push any newly synced Pages files (`docs/`, root `index.html` / `assets/` / `404.html` / `.nojekyll`).

## 4. Deploy Render (always ship `origin/main`)

Render auto-deploys **https://political-ddmj.onrender.com/** from **`origin/main`**.

1. Fast-forward or merge the shipped commit onto `origin/main` (`git push origin <branch>:main` when the branch is based on current `main` and the user wants production, or merge the PR then confirm `main` has the commit).
2. A feature-branch push is **not** a Render deploy. `origin/main` must move.

## 5. Report

Tell the user:

- Commit SHA and branch
- That git was pushed
- GitHub Pages action (`npm run deploy` result)
- Whether `origin/main` was updated for Render
- Volunteer/officer clients must hard-refresh after Pages publish
