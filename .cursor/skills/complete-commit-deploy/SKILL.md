---
name: complete-commit-deploy
description: >-
  REQUIRED after every code change. Update skills if the workflow changed,
  commit, push to git, deploy the frontend to Cloudflare Pages, and deploy
  the backend to Render via origin/main. GitHub Pages is retired.
---

# Every code change → git push → Cloudflare Pages → Render

Do this in the **same turn** as the code change. Do not stop at “code is done.”
Do not wait for the user to ask. Feature-branch-only work is not deployed.

Production frontend is **Cloudflare Pages**, not GitHub Pages. Do not run `gh-pages`, do not copy builds into `docs/` or the repo root, and do not treat a GitHub Pages publish as a production deploy.

## 0. Add / update skills

If this change affects how we ship (git, Cloudflare Pages, Render, quality gates), update:

- `.cursor/skills/complete-commit-deploy/SKILL.md` (canonical)
- `.agent/skills/complete-commit-deploy/SKILL.md` (pointer)
- `.agent/skills/smart-deployment/SKILL.md`
- `.agent/rules/deployment-rules.md`
- `AGENTS.md`

If this change affects screens, layout, or rendered fields, also follow `.cursor/skills/cross-device-ui-parity/SKILL.md`.

Before implementing a **new** product, UI, role, routing, or data change, follow `.cursor/skills/confirm-before-change/SKILL.md`.

Keep those files in the same commit as the related code when the workflow itself changed.

## 1. Quality gates

- From `frontend/`: `npm run build` (TypeScript + Vite + `sync_build.js`). Fix errors before committing.
- Confirm `frontend/public/_redirects` exists (`/*    /index.html   200`) so Cloudflare Pages SPA routes work. `sync_build.js` copies it into `frontend/dist/`.
- If `backend/` changed: `PYTHONPATH=<repo> python3 -m pytest backend/tests -n 0`.
- **Every screen size.** Laptop, desktop, tablet, iPad, and mobile must show the same alignment and the same information.

UI automation (`node scripts/run_ui_tests.mjs`) is optional extra coverage. It does **not** replace the Cloudflare Pages deploy.

## 2. Commit and push git

- Stage source, tests, skill/rule files, and `frontend/` config. Do not commit secrets, `.env`, `.deploy_credentials.json`, or tokens.
- Do not stage leftover GitHub Pages artifacts (`docs/`, root `index.html` / `assets/` / `CNAME` / `.nojekyll`) unless the user asked to delete them.
- Skip unrelated dirty files (for example unused `yarn.lock` churn).
- Commit with a short imperative message.
- Push the working branch: `git push -u origin <branch-name>`.
- Create or update the pull request for that branch.

## 3. Deploy Cloudflare Pages (always when the turn produced a frontend change)

Site: **https://leaderslensconsulting.com**  
Project: **`leaders-lens`** (`https://leaders-lens.pages.dev`)  
Account: `1b9ccc1557ec43d14cd6980a2aae9089`

1. `cd frontend && npm run build`
2. Deploy the **existing** `frontend/dist` folder (do not rebuild again unless the build is stale):

```bash
cd frontend
npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true
```

Auth (never paste keys into git or chat):

- Preferred: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
- Legacy: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` + `CLOUDFLARE_ACCOUNT_ID`

If this environment has no Cloudflare credentials, still push to `origin/main` so `.github/workflows/cloudflare-pages.yml` can deploy. Do **not** fall back to GitHub Pages.

Never use `wrangler deploy` (Workers) for this frontend. Never use `npx wrangler deploy --temporary`.

## 4. Deploy Render (always ship `origin/main`)

Render auto-deploys **https://political-ddmj.onrender.com/** from **`origin/main`**.

1. Fast-forward or merge onto `origin/main` (`git push origin <branch>:main` when the branch is based on current `main`).
2. A feature-branch push is **not** a Render deploy.

## 5. Report

Tell the user:

- Commit SHA and branch
- That git was pushed
- Cloudflare Pages deploy result (or that Actions must supply the token)
- Whether `origin/main` was updated for Render
- That clients must hard-refresh https://leaderslensconsulting.com after the Pages publish
