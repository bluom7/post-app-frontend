'use strict';
const fs = require('fs');
const path = require('path');
const indexPath = path.join(__dirname, 'index.html');
const marker = '<!-- feed-video-preload-guard -->';
const guardScript = '<script data-feed-video-preload-guard>' + "(function () {\n  if (!window.React) return;\n  var originalCreateElement = React.createElement;\n  React.createElement = function (type, props) {\n    var args = Array.prototype.slice.call(arguments);\n    if (type === \"video\") {\n      var src = props && props.src;\n      var isRemote = typeof src === \"string\" &&\n        (src.indexOf(\"https://\") === 0 || src.indexOf(\"http://\") === 0);\n      if (isRemote && !(props && Object.prototype.hasOwnProperty.call(props, \"preload\"))) {\n        args[1] = Object.assign({}, props, { preload: \"none\" });\n      }\n    }\n    return originalCreateElement.apply(this, args);\n  };\n})();" + '</script>';
async function main() {
  const html = await fs.promises.readFile(indexPath, 'utf8');
  if (html.includes(marker)) return;
  const headEnd = html.toLowerCase().lastIndexOf('</head>');
  if (headEnd < 0) throw new Error('index.html has no closing </head> tag');
  const updated = html.slice(0, headEnd) + marker + '\n' + guardScript + '\n' + html.slice(headEnd);
  await fs.promises.writeFile(indexPath, updated, 'utf8');
}
main().catch(error => { console.error('Could not inject feed video preload guard:', error); process.exitCode = 1; });
