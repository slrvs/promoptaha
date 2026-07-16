const fs = require("fs");
const path = require("path");

const packagePath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

packageJson.scripts = packageJson.scripts || {};
packageJson.scripts["smoke:live"] = "node scripts/smokeLive.cjs";

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

console.log("Added npm script: smoke:live");
