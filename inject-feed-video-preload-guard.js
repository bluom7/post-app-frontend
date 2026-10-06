'use strict';
const fs = require('fs');
const path = require('path');
const indexPath = path.join(__dirname, 'index.html');
const guards = [
  { marker: '<!-- feed-video-preload-guard -->', script: '<script data-feed-video-preload-guard>' + "(function () {\n  if (!window.React) return;\n  var originalCreateElement = React.createElement;\n  React.createElement = function (type, props) {\n    var args = Array.prototype.slice.call(arguments);\n    if (type === \"video\") {\n      var src = props && props.src;\n      var isRemote = typeof src === \"string\" &&\n        (src.indexOf(\"https://\") === 0 || src.indexOf(\"http://\") === 0);\n      if (isRemote && !(props && Object.prototype.hasOwnProperty.call(props, \"preload\"))) {\n        args[1] = Object.assign({}, props, { preload: \"none\" });\n      }\n    }\n    return originalCreateElement.apply(this, args);\n  };\n})();" + '</script>' },
  { marker: '<!-- feed-cache-guard -->', script: '<script data-feed-cache-guard>' + "(function () {\n  if (typeof Storage === \"undefined\" || !Storage.prototype) return;\n  var feedPrefix = \"post_feed_cache_\";\n  var maxChars = 512 * 1024;\n  var inlineMedia = /data:(?:image|video|audio)\\//i;\n  var getItem = Storage.prototype.getItem;\n  var setItem = Storage.prototype.setItem;\n  var removeItem = Storage.prototype.removeItem;\n  Storage.prototype.getItem = function (key) {\n    var value = getItem.call(this, key);\n    if (typeof key === \"string\" && key.indexOf(feedPrefix) === 0 && value !== null &&\n        (value.length > maxChars || inlineMedia.test(value))) {\n      removeItem.call(this, key);\n      return null;\n    }\n    return value;\n  };\n  Storage.prototype.setItem = function (key, value) {\n    if (typeof key === \"string\" && key.indexOf(feedPrefix) === 0) {\n      var text = String(value);\n      if (text.length > maxChars || inlineMedia.test(text)) {\n        removeItem.call(this, key);\n        return;\n      }\n    }\n    return setItem.call(this, key, value);\n  };\n})();" + '</script>' },
];
async function main() {
  const html = await fs.promises.readFile(indexPath, 'utf8');
  const missing = guards.filter(guard => !html.includes(guard.marker));
  if (!missing.length) return;
  const headEnd = html.toLowerCase().lastIndexOf('</head>');
  if (headEnd < 0) throw new Error('index.html has no closing </head> tag');
  const injection = missing.map(guard => guard.marker + '\n' + guard.script).join('\n');
  const updated = html.slice(0, headEnd) + injection + '\n' + html.slice(headEnd);
  await fs.promises.writeFile(indexPath, updated, 'utf8');
}
main().catch(error => { console.error('Could not inject feed guards:', error); process.exitCode = 1; });
