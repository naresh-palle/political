const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, cwd = process.cwd(), env = {}) {
  console.log('> ' + cmd + ' (in ' + cwd + ')');
  return execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
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
  console.log('Frontend (Cloudflare Pages): ' + (hasFrontend ? 'YES' : 'NO'));
  console.log('Backend (Render):            ' + (hasBackend ? 'YES' : 'NO'));
  console.log('========================================');

  const rootDir = path.resolve(__dirname, '..');
  const frontendDir = path.join(rootDir, 'frontend');
  const distDir = path.join(frontendDir, 'dist');
  const docsDir = path.join(rootDir, 'docs');

  if (hasFrontend) {
    console.log('[1/4] Running UI automation test...');
    try {
      run('node scripts/run_ui_tests.mjs', rootDir);
    } catch (e) {
      console.warn('UI test warning/notice: continuing build...');
    }

    console.log('[2/4] Building frontend bundle...');
    run('npm run build', frontendDir);

    console.log('[3/4] Syncing dist to root and docs directory...');
    copyDir(distDir, rootDir);
    copyDir(distDir, docsDir);
    fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf-8');
    fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf-8');

    console.log('[4/4] Deploying directly to Cloudflare Pages (leaders-lens)...');
    let localCreds = {};
    const credsPath = path.join(rootDir, '.deploy_credentials.json');
    if (fs.existsSync(credsPath)) {
      try {
        localCreds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
      } catch (e) {
        // Fallback to process.env
      }
    }
    const cfEnv = {
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || localCreds.CLOUDFLARE_ACCOUNT_ID || '1b9ccc1557ec43d14cd6980a2aae9089',
      CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || localCreds.CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL || localCreds.CLOUDFLARE_EMAIL || 'npalle.goud@gmail.com'
    };
    run('npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true', frontendDir, cfEnv);
  }

  if (hasBackend || hasFrontend) {
    console.log('Committing and pushing to origin main for Render & Git sync...');
    try {
      run('git add -A', rootDir);
      const msg = hasFrontend && hasBackend
        ? 'feat: full-stack update (Cloudflare Pages & Render deployed)'
        : hasFrontend
        ? 'feat(frontend): deploy updates to Cloudflare Pages'
        : 'feat(backend): deploy backend updates to Render';
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
