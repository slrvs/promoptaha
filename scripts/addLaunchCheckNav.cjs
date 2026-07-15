const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "components", "SiteNav.tsx");

let content = fs.readFileSync(filePath, "utf8");

if (content.includes('href: "/admin/launch-check"')) {
  console.log("SKIP: /admin/launch-check already exists");
  process.exit(0);
}

const launchCheckLink = `  {
    href: "/admin/launch-check",
    label: "Launch check",
    description: "Чеклист перед публічним запуском",
  },
`;

const pattern =
  /(\s*\{\r?\n\s*href:\s*"\/admin\/activity",[\s\S]*?\r?\n\s*\},\r?\n)/;

if (pattern.test(content)) {
  content = content.replace(pattern, `$1${launchCheckLink}`);
} else {
  const fallbackPattern =
    /(\s*\{\r?\n\s*href:\s*"\/admin\/stats",[\s\S]*?\r?\n\s*\},\r?\n)/;

  if (!fallbackPattern.test(content)) {
    console.error("Не знайшов місце для вставки в components/SiteNav.tsx");
    process.exit(1);
  }

  content = content.replace(fallbackPattern, `$1${launchCheckLink}`);
}

fs.writeFileSync(filePath, content, "utf8");

console.log("ADDED: /admin/launch-check to admin menu");
