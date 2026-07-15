const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "components", "SiteNav.tsx");

let content = fs.readFileSync(filePath, "utf8");

if (content.includes('href: "/admin/activity"')) {
  console.log("SKIP: /admin/activity already exists");
  process.exit(0);
}

const activityLink = `  {
    href: "/admin/activity",
    label: "Журнал дій",
    description: "Історія модерації та адмінських змін",
  },
`;

const pattern =
  /(\s*\{\r?\n\s*href:\s*"\/admin\/stats",[\s\S]*?\r?\n\s*\},\r?\n)/;

if (!pattern.test(content)) {
  console.error("Не знайшов пункт /admin/stats у components/SiteNav.tsx");
  process.exit(1);
}

content = content.replace(pattern, `$1${activityLink}`);

fs.writeFileSync(filePath, content, "utf8");

console.log("ADDED: /admin/activity to admin menu");
