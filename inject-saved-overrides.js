const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "index.html");
const scriptTag = '<script src="/saved-library-overrides.js"></script>';
let html = fs.readFileSync(indexPath, "utf8");

if (!html.includes(scriptTag)) {
  if (!html.includes("</head>")) throw new Error("Could not find </head> in index.html");
  html = html.replace("</head>", scriptTag + "\n</head>");
  fs.writeFileSync(indexPath, html, "utf8");
}

console.log("Saved screen script ready");
