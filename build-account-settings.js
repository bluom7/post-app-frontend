'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const indexPath = path.join(root, 'index.html');
const scriptPath = path.join(root, 'account-settings.js');
if (!fs.existsSync(scriptPath)) throw new Error('account-settings.js is missing from the static site build.');
let html = fs.readFileSync(indexPath, 'utf8');
const marker = 'src="/account-settings.js"';
if (html.includes(marker)) {
  console.log('Account settings script is already included.');
} else {
  const headIndex = html.toLowerCase().indexOf('</head>');
  if (headIndex < 0) throw new Error('Could not find </head> in index.html.');
  const tag = '  <script defer src="/account-settings.js"></script>\n';
  html = html.slice(0, headIndex) + tag + html.slice(headIndex);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Included account-settings.js in the static HTML.');
}
