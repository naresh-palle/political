const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.resolve(__dirname, 'INVESTOR_GOLIVE_PROPOSAL.html');
const pdfPath = path.resolve(__dirname, 'LeadersLens_Investor_Proposal.pdf');

if (fs.existsSync(pdfPath)) {
  try { fs.unlinkSync(pdfPath); } catch (e) {}
}

const possibleBrowsers = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
];

let browserPath = null;
for (const b of possibleBrowsers) {
  if (b && fs.existsSync(b)) {
    browserPath = b;
    break;
  }
}

if (!browserPath) {
  console.error('No Chrome or Edge browser found on this machine.');
  process.exit(1);
}

console.log(`Found browser at: ${browserPath}`);
console.log(`Generating PDF from: ${htmlPath}`);

const cmd = `"${browserPath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log(`Executing: ${cmd}`);

try {
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`SUCCESS! Generated PDF: ${pdfPath} (${stats.size} bytes)`);
  } else {
    console.error('PDF generation command finished but file was not found.');
  }
} catch (err) {
  console.error('Error generating PDF:', err);
}
