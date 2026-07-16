const fs = require("fs");
const path = require("path");

const smokePath = path.join(process.cwd(), "scripts", "smokeTestLocal.cjs");

let content = fs.readFileSync(smokePath, "utf8");

if (!content.includes('"/terms"')) {
  content = content.replace('"/privacy",', '"/privacy",\n  "/terms",');
}

fs.writeFileSync(smokePath, content, "utf8");

console.log("Added /terms to smoke test routes");
