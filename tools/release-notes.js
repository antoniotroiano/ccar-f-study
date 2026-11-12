/* Prints the CHANGELOG entry of one version, to paste into the description of a GitHub release.
   Usage: node tools/release-notes.js            (current version from js/version.js)
          node tools/release-notes.js 0.2.0 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const current = (fs.readFileSync(path.join(root, "js", "version.js"), "utf8").match(/APP_VERSION = "(\d+\.\d+\.\d+)"/) || [])[1];
const version = process.argv[2] || current;

const lines = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8").split("\n");
const start = lines.findIndex(function (line) { return line.indexOf("## " + version + " ") === 0; });
if (start === -1) {
  console.error("No entry for version " + version + " in CHANGELOG.md");
  process.exit(1);
}
let end = lines.findIndex(function (line, index) { return index > start && line.indexOf("## ") === 0; });
if (end === -1) end = lines.length;

console.log("Tag: v" + version);
console.log("Title: " + lines[start].replace("## ", ""));
console.log("");
console.log(lines.slice(start + 1, end).join("\n").trim());
if (version !== current) console.error("\nNote: the app itself is at version " + current + ".");
