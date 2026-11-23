---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change. Update skills if the workflow changed,
  commit, push origin/main. Cloudflare builds the frontend from Git automatically.
  Render deploys the backend from origin/main. GitHub Pages is retired. No Cloudflare API token. No GitHub Actions deploy.
---

# Every code change → build → push origin/main

Do this in the **same turn**. Feature-branch-only work is not production.

Production frontend is **Cloudflare** (https://leaderslensconsulting.com), built from Git when `main` moves. Do **not** add GitHub Actions for Cloudflare. Do **not** ask for a Cloudflare API token. Do **not** run `gh-pages`. Do **not** copy builds into `docs/` or the repo root for GitHub Pages.

## 0. Skills

If git / Cloudflare / Render shipping changed, update this file, `.agent/skills/complete-commit-deploy/SKILL.md`, `.agent/skills/smart-deployment/SKILL.md`, `.agent/rules/deployment-rules.md`, and `AGENTS.md` in the same commit.

## 1. Quality gates

- From `frontend/`: `npm run build`. That also prepares `frontend/dist` (`_redirects`, `404.html`).
- Root `npm run build` builds the frontend and copies `frontend/dist` → `dist/` so Cloudflare Git (Path `/`, `npm run build`) publishes the Vite app, not Python.
- If `backend/` changed: `PYTHONPATH=<repo> python3 -m pytest backend/tests -n 0`.
- Same alignment and information on laptop, desktop, tablet, iPad, and mobile.

## 2. Git

- Stage source, tests, and skills. Never commit secrets, `.env`, or tokens.
- Skip unrelated `yarn.lock` churn.
- Commit, push the branch, and update `origin/main`.

## 3. Frontend: Cloudflare Git (automatic)

Pushing `origin/main` is the deploy. Cloudflare already has Git access; it does not use a Wrangler token in GitHub.

- Project: `leaders-lens` (https://leaders-lens.pages.dev and https://leaderslensconsulting.com)
- Root `package.json` `build` → frontend Vite build
- `wrangler.toml` `pages_build_output_dir = "./dist"` (Pages Git, not Workers `[assets]`)

Do not create `.github/workflows` Cloudflare deploy jobs. Do not run `npx wrangler pages deploy` unless the user already has Wrangler logged in locally.

## 4. Backend: Render

Render deploys https://political-ddmj.onrender.com/ from `origin/main`.

## 5. Report

Commit SHA, that `origin/main` was pushed, and that Cloudflare Git / Render pick it up. Ask for a hard-refresh of https://leaderslensconsulting.com.
