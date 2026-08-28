# Continuous Deployment & Quality Rules

## 1. Zero Broken Deployments
- Whenever code changes are made, run 
pm run build in rontend/ to confirm zero TypeScript and Vite bundle errors before pushing.
- Always ensure .nojekyll and 404.html exist in docs/ and root . so GitHub Pages routing never shows a 404.

## 2. Selective & Targeted Deployment
- **Frontend Changes** -> Deploy to GitHub Pages (gh-pages, docs/, root).
- **Backend / MongoDB Changes** -> Deploy to Render via origin main.
- **Full-Stack Changes** -> Execute both deployment pipelines.
