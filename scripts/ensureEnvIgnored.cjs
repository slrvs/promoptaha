const fs = require("fs");
const path = require("path");

const gitignorePath = path.join(process.cwd(), ".gitignore");

let content = "";

if (fs.existsSync(gitignorePath)) {
  content = fs.readFileSync(gitignorePath, "utf8");
}

const linesToAdd = [
  ".env*.local",
  ".env.local",
];

for (const line of linesToAdd) {
  if (!content.includes(line)) {
    content += `${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${line}\n`;
  }
}

fs.writeFileSync(gitignorePath, content, "utf8");

console.log("Updated .gitignore");
