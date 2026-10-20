/* Checks catalog files (JSON) the same way the app does before an import.
   Usage: node tools/validate-catalog.js my-catalog.json [more.json]
   Exit code 0: all files are valid (notes are fine). Exit code 1: at least one file has problems. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node tools/validate-catalog.js <catalog.json> [more.json]");
  process.exit(2);
}

// the checking code is shared with the browser app
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "catalog-import.js"), "utf8") + "\nthis.validateCatalogJson = validateCatalogJson;", sandbox);

let failed = false;
files.forEach(function (file) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error(file + ": not valid JSON (" + error.message + ")");
    failed = true;
    return;
  }
  const result = sandbox.validateCatalogJson(data, []);
  if (result.errors.length) {
    failed = true;
    console.error(file + ": " + result.errors.length + " problem(s)");
    result.errors.forEach(function (message) { console.error("  - " + message); });
  } else {
    console.log(file + ": OK, " + result.catalog.questions.length + " questions");
  }
  result.warnings.forEach(function (message) { console.log("  note: " + message); });
});
process.exit(failed ? 1 : 0);
