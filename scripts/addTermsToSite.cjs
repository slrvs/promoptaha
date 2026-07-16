const fs = require("fs");
const path = require("path");

function updateFile(relativePath, updater) {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${relativePath} not found`);
    return;
  }

  const before = fs.readFileSync(filePath, "utf8");
  const after = updater(before);

  if (after === before) {
    console.log(`OK: ${relativePath} already up to date`);
    return;
  }

  fs.writeFileSync(filePath, after, "utf8");
  console.log(`UPDATED: ${relativePath}`);
}

updateFile("components/SiteFooter.tsx", (content) => {
  if (content.includes('href="/terms"')) {
    return content;
  }

  const termsLink = `
            <Link
              href="/terms"
              className="text-slate-400 transition hover:text-emerald-300"
            >
              Умови використання
            </Link>`;

  if (content.includes('href="/privacy"')) {
    return content.replace(
      /(\s*<Link\s+href="\/privacy"[\s\S]*?<\/Link>)/,
      `$1${termsLink}`
    );
  }

  if (content.includes('href="/rules"')) {
    return content.replace(
      /(\s*<Link\s+href="\/rules"[\s\S]*?<\/Link>)/,
      `$1${termsLink}`
    );
  }

  return content;
});

updateFile("app/sitemap.ts", (content) => {
  if (content.includes('"/terms"') || content.includes("'/terms'")) {
    return content;
  }

  if (content.includes('"/privacy"')) {
    return content.replace('"/privacy",', '"/privacy",\n    "/terms",');
  }

  if (content.includes("'/privacy'")) {
    return content.replace("'/privacy',", "'/privacy',\n    '/terms',");
  }

  return content;
});

updateFile("app/robots.ts", (content) => {
  if (content.includes('"/terms"') || content.includes("'/terms'")) {
    return content;
  }

  if (content.includes('"/privacy"')) {
    return content.replace('"/privacy",', '"/privacy",\n            "/terms",');
  }

  if (content.includes("'/privacy'")) {
    return content.replace("'/privacy',", "'/privacy',\n            '/terms',");
  }

  return content;
});

updateFile("scripts/preflight.cjs", (content) => {
  if (content.includes('"app/terms/page.tsx"')) {
    return content;
  }

  if (content.includes('"app/robots.ts",')) {
    return content.replace(
      '"app/robots.ts",',
      '"app/robots.ts",\n  "app/terms/page.tsx",'
    );
  }

  return content;
});

console.log("");
console.log("Done. Now run:");
console.log("npm run launch:check");
