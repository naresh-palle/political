const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, cwd = process.cwd()) {
  console.log('> ' + cmd + ' (in ' + cwd + ')');
  return execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcP = path.join(src, entry.name);
    const destP = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcP, destP);
    else fs.copyFileSync(srcP, destP);
  }
}

function detectChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const files = status.split('\n').filter(Boolean).map(l => l.substring(3));
    let hasFrontend = files.some(f => f.startsWith('frontend/') || f.startsWith('docs/') || f.endsWith('.html') || f.startsWith('assets/'));
    let hasBackend = files.some(f => f.startsWith('backend/') || f.endsWith('.py') || f.startsWith('render.yaml') || f.startsWith('start.sh') || f.startsWith('build.sh') || f.endsWith('package.json'));
    return { hasFrontend, hasBackend, files };
  } catch (e) {
    return { hasFrontend: true, hasBackend: true, files: [] };
  }
}

function main() {
  const args = process.argv.slice(2);
  let { hasFrontend, hasBackend } = detectChanges();

  if (args.includes('--frontend')) { hasFrontend = true; hasBackend = false; }
  else if (args.includes('--backend')) { hasFrontend = false; hasBackend = true; }
  else if (args.includes('--both') || args.includes('--all')) { hasFrontend = true; hasBackend = true; }

  console.log('========================================');
  console.log('SMART DEPLOYMENT PROTOCOL TRIGGERED');
  console.log('Frontend (GH Pages): ' + (hasFrontend ? 'YES' : 'NO'));
  console.log('Backend (Render):     ' + (hasBackend ? 'YES' : 'NO'));
  console.log('========================================');

  const rootDir = path.join(__dirname, '..');
  const frontendDir = path.join(rootDir, 'frontend');
  const distDir = path.join(frontendDir, 'dist');
  const docsDir = path.join(rootDir, 'docs');

  if (hasFrontend) {
    console.log('[1/3] Building frontend bundle...');
    run('npm run build', frontendDir);

    console.log('[2/3] Syncing dist to root and docs directory...');
    copyDir(distDir, rootDir);
    copyDir(distDir, docsDir);
    fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf-8');
    fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf-8');

    console.log('[3/3] Deploying to gh-pages branch...');
    run('npm run deploy', frontendDir);
  }

  if (hasBackend || hasFrontend) {
    console.log('Committing and pushing to origin main...');
    try {
      run('git add -A', rootDir);
      const msg = hasFrontend && hasBackend
        ? 'feat: full-stack update (gh-pages & render deployed)'
        : hasFrontend
        ? 'feat(frontend): deploy updates to gh-pages'
        : 'feat(backend): deploy backend updates to render';
      run('git commit -m "' + msg + '"', rootDir);
    } catch (e) {
      console.log('No new changes to commit.');
    }
    run('git push origin main', rootDir);
  }

  console.log('========================================');
  console.log('SUCCESS: Targeted deployment complete.');
  console.log('========================================');
}

main();
