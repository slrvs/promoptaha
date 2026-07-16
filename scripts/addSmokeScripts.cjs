const fs = require("fs");
const path = require("path");

const packagePath = path.join(process.cwd(), "package.json");

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

packageJson.scripts = packageJson.scripts || {};

packageJson.scripts.smoke = "node scripts/smokeTestLocal.cjs";
packageJson.scripts["smoke:local"] = "node scripts/smokeTestLocal.cjs";

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

console.log("UPDATED: package.json scripts");
console.log("Added:");
console.log("- npm run smoke");
console.log("- npm run smoke:local");
