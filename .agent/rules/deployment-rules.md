# Continuous Deployment & Quality Rules

## 1. Quality
- `npm run build` in `frontend/` before pushing.
- Keep `frontend/public/_redirects` for SPA routing.
- Same alignment and information on every screen size.

## 2. Every code change
1. Update skills if the ship path changed.
2. Push `origin/main`.
3. Cloudflare Git builds the frontend. Render deploys the backend.

Do not add GitHub Actions for Cloudflare. Do not ask for a Cloudflare API token. GitHub Pages is retired.

## 3. Production targets
- **Frontend** → Cloudflare Git (`leaders-lens` / https://leaderslensconsulting.com)
- **Backend** → Render via `origin/main`
