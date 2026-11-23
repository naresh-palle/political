const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, cwd = process.cwd(), env = {}) {
  console.log('> ' + cmd + ' (in ' + cwd + ')');
  return execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });
}

function detectChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const files = status.split('\n').filter(Boolean).map((l) => l.substring(3));
    const hasFrontend = files.some((f) => f.startsWith('frontend/'));
    const hasBackend = files.some(
      (f) =>
        f.startsWith('backend/') ||
        f.endsWith('.py') ||
        f.startsWith('render.yaml') ||
        f.startsWith('start.sh') ||
        f.startsWith('build.sh')
    );
    return { hasFrontend, hasBackend };
  } catch (e) {
    return { hasFrontend: true, hasBackend: true };
  }
}

function loadLocalCreds(rootDir) {
  const credsPath = path.join(rootDir, '.deploy_credentials.json');
  if (!fs.existsSync(credsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function main() {
  const args = process.argv.slice(2);
  let { hasFrontend, hasBackend } = detectChanges();

  if (args.includes('--frontend')) {
    hasFrontend = true;
    hasBackend = false;
  } else if (args.includes('--backend')) {
    hasFrontend = false;
    hasBackend = true;
  } else if (args.includes('--both') || args.includes('--all')) {
    hasFrontend = true;
    hasBackend = true;
  }

  console.log('========================================');
  console.log('SMART DEPLOYMENT');
  console.log('Frontend (Cloudflare Pages): ' + (hasFrontend ? 'YES' : 'NO'));
  console.log('Backend (Render):            ' + (hasBackend ? 'YES' : 'NO'));
  console.log('========================================');

  const rootDir = path.resolve(__dirname, '..');
  const frontendDir = path.join(rootDir, 'frontend');

  if (hasFrontend) {
    console.log('[1/2] Building frontend…');
    run('npm run build', frontendDir);

    console.log('[2/2] Deploying frontend/dist to Cloudflare Pages project leaders-lens…');
    const localCreds = loadLocalCreds(rootDir);
    const cfEnv = {
      CLOUDFLARE_ACCOUNT_ID:
        process.env.CLOUDFLARE_ACCOUNT_ID ||
        localCreds.CLOUDFLARE_ACCOUNT_ID ||
        '1b9ccc1557ec43d14cd6980a2aae9089',
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || localCreds.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || localCreds.CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL || localCreds.CLOUDFLARE_EMAIL
    };
    if (!cfEnv.CLOUDFLARE_API_TOKEN && !(cfEnv.CLOUDFLARE_API_KEY && cfEnv.CLOUDFLARE_EMAIL)) {
      throw new Error(
        'Missing Cloudflare credentials. Set CLOUDFLARE_API_TOKEN, or CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL. GitHub Pages is retired.'
      );
    }
    run(
      'npx wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true',
      frontendDir,
      cfEnv
    );
  }

  console.log('Push origin/main separately so Render picks up backend changes.');
  console.log('========================================');
  console.log('SUCCESS: targeted Cloudflare Pages deploy complete.');
  console.log('========================================');
}

main();
