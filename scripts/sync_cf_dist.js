const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'frontend', 'dist');
const dest = path.join(root, 'dist');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const fromP = path.join(from, entry.name);
    const toP = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(fromP, toP);
    else fs.copyFileSync(fromP, toP);
  }
}

if (!fs.existsSync(path.join(src, 'index.html'))) {
  throw new Error('frontend/dist/index.html missing; frontend build did not run');
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log('✓ Copied frontend/dist → dist for Cloudflare Git builds');
