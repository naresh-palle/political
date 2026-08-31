import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = __dirname;
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Create 404.html in dist
const distIndex = path.join(distDir, 'index.html');
const dist404 = path.join(distDir, '404.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, dist404);
}

// 2. Sync dist to docs/
if (fs.existsSync(distDir)) {
  copyDir(distDir, docsDir);
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf-8');
  console.log('✓ Synced dist to docs/ with .nojekyll and 404.html');
}

// 3. Sync dist critical assets to root . (index.html, 404.html, assets, images)
if (fs.existsSync(distDir)) {
  fs.copyFileSync(distIndex, path.join(rootDir, 'index.html'));
  fs.copyFileSync(distIndex, path.join(rootDir, '404.html'));
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf-8');
  
  const distAssets = path.join(distDir, 'assets');
  const rootAssets = path.join(rootDir, 'assets');
  if (fs.existsSync(distAssets)) {
    if (fs.existsSync(rootAssets)) {
      fs.rmSync(rootAssets, { recursive: true, force: true });
    }
    copyDir(distAssets, rootAssets);
  }

  const distImages = path.join(distDir, 'images');
  const rootImages = path.join(rootDir, 'images');
  if (fs.existsSync(distImages)) {
    copyDir(distImages, rootImages);
  }
  console.log('✓ Synced dist to root . with updated index.html, assets, and images');
}
