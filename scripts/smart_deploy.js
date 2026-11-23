const { execSync } = require('child_process');

function run(cmd, cwd = process.cwd()) {
  console.log('> ' + cmd);
  return execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
}

const rootDir = require('path').resolve(__dirname, '..');
console.log('Building frontend for Cloudflare Git (no API token, no GitHub Action)…');
run('npm run build', rootDir);
console.log('Push origin/main. Cloudflare builds from Git automatically.');
