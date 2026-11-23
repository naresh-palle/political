const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, cwd = process.cwd(), env = process.env) {
  console.log('> ' + cmd);
  return execSync(cmd, { cwd, stdio: 'inherit', env });
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

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

console.log('Building frontend for Cloudflare Pages…');
run('npm run build', frontendDir);

const localCreds = loadLocalCreds(rootDir);
const cfEnv = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID:
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    localCreds.CLOUDFLARE_ACCOUNT_ID ||
    '1b9ccc1557ec43d14cd6980a2aae9089',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || localCreds.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || localCreds.CLOUDFLARE_API_KEY,
  CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL || localCreds.CLOUDFLARE_EMAIL
};

if (cfEnv.CLOUDFLARE_API_TOKEN || (cfEnv.CLOUDFLARE_API_KEY && cfEnv.CLOUDFLARE_EMAIL)) {
  console.log('Deploying build directly to Cloudflare Pages (leaders-lens)…');
  try {
    run(
      'npx --yes wrangler pages deploy dist --project-name leaders-lens --commit-dirty=true',
      frontendDir,
      cfEnv
    );
    console.log('✓ Successfully deployed to Cloudflare Pages: https://leaderslensconsulting.com');
  } catch (e) {
    console.warn('Wrangler direct deploy notice:', e.message);
  }
} else {
  console.log('No local credentials found; Cloudflare Git builds from origin/main.');
}
