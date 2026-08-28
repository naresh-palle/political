---
name: smart-deployment
description: >-
  Intelligent target-based deployment protocol for Leader's Lens.
  Automatically determines whether changes affect GitHub Pages (frontend), Render (backend), or both,
  and executes the targeted deployment pipeline accordingly.
---

# Smart Deployment Protocol

## Target Assessment Rules

When code modifications occur:

1. **GitHub Pages Deploy (Frontend Only)**:
   - **Triggers**: Changes in rontend/src/, rontend/public/, rontend/index.html, rontend/package.json, docs/, *.css, UI components, or layouts.
   - **Procedure**:
     1. Build the production bundle: 
pm run build in rontend/.
     2. Sync rontend/dist/* to project root . and /docs/ with .nojekyll.
     3. Deploy to gh-pages branch: 
pm run deploy in rontend/.
     4. Push commit to origin main.

2. **Render Deploy (Backend Only)**:
   - **Triggers**: Changes in ackend/, ackend/server.py, ackend/models/, ackend/requirements.txt, start.sh, uild.sh, 
ender.yaml.
   - **Procedure**:
     1. Commit all backend changes to git.
     2. Push commit to origin main to trigger Render's webhook auto-deploy for https://political-ddmj.onrender.com/.

3. **Dual Deployment (Both)**:
   - **Triggers**: Changes affecting both layers (e.g. rontend/src/types/index.ts + ackend/models/, pi.ts + server.py, geography master dataset generator, seed scripts, root configs).
   - **Procedure**:
     1. Execute Frontend Build & gh-pages deployment.
     2. Sync rontend/dist to root and docs/.
     3. Commit all changes and push to origin main (triggering Render).
