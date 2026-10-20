/* Raises the app version in one step before a deploy.
   Usage: node tools/bump-version.js patch|minor|major|<x.y.z> [--date YYYY-MM-DD]
          node tools/bump-version.js            (prints the current version)
   Changes js/version.js and every ?v= in index.html. Does not touch CHANGELOG.md: add the entry yourself. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const versionFile = path.join(root, "js", "version.js");
const indexFile = path.join(root, "index.html");

const source = fs.readFileSync(versionFile, "utf8");
const current = (source.match(/APP_VERSION = "(\d+\.\d+\.\d+)"/) || [])[1];
if (!current) {
  console.error("Could not find APP_VERSION in js/version.js");
  process.exit(1);
}

const args = process.argv.slice(2);
const dateFlag = args.indexOf("--date");
let date = new Date().toISOString().slice(0, 10);
if (dateFlag !== -1) {
  date = args.splice(dateFlag, 2)[1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    console.error("--date needs a date like 2026-10-20");
    process.exit(1);
  }
}

if (args.length === 0) {
  console.log("Current version: " + current + " (" + (source.match(/APP_BUILD_DATE = "([^"]+)"/) || [])[1] + ")");
  process.exit(0);
}

const parts = current.split(".").map(Number);
let next;
if (args[0] === "patch") next = [parts[0], parts[1], parts[2] + 1];
else if (args[0] === "minor") next = [parts[0], parts[1] + 1, 0];
else if (args[0] === "major") next = [parts[0] + 1, 0, 0];
else if (/^\d+\.\d+\.\d+$/.test(args[0])) next = args[0].split(".").map(Number);
else {
  console.error("Use patch, minor, major or a version like 1.2.3");
  process.exit(1);
}
const version = next.join(".");

fs.writeFileSync(versionFile, source
  .replace(/APP_VERSION = "[^"]+"/, 'APP_VERSION = "' + version + '"')
  .replace(/APP_BUILD_DATE = "[^"]+"/, 'APP_BUILD_DATE = "' + date + '"'));

const html = fs.readFileSync(indexFile, "utf8");
let replaced = 0;
fs.writeFileSync(indexFile, html.replace(/\?v=[^"'\s]+/g, function () {
  replaced++;
  return "?v=" + version;
}));

console.log("Version " + current + " -> " + version + " (" + date + "), updated " + replaced + " file links in index.html.");
console.log("Next: add an entry to CHANGELOG.md, test, then deploy.");
