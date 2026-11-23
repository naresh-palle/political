import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = __dirname;
const distDir = path.join(frontendDir, 'dist');
const publicDir = path.join(frontendDir, 'public');
const distIndex = path.join(distDir, 'index.html');
const dist404 = path.join(distDir, '404.html');
const distRedirects = path.join(distDir, '_redirects');
const public404 = path.join(publicDir, '404.html');
const publicRedirects = path.join(publicDir, '_redirects');

if (!fs.existsSync(distIndex)) {
  console.warn('sync_build: frontend/dist/index.html missing; skip Cloudflare SPA files.');
  process.exit(0);
}

fs.copyFileSync(distIndex, dist404);
if (fs.existsSync(publicDir)) {
  fs.copyFileSync(distIndex, public404);
}

const redirects = fs.existsSync(publicRedirects)
  ? fs.readFileSync(publicRedirects, 'utf-8')
  : '/*    /index.html   200\n';
fs.writeFileSync(distRedirects, redirects.endsWith('\n') ? redirects : `${redirects}\n`, 'utf-8');

console.log('✓ Prepared frontend/dist for Cloudflare Pages (404.html + _redirects). GitHub Pages copies are not written.');
