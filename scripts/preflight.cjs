const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/sitemap.ts",
  "app/robots.ts",
  "app/terms/page.tsx",
  "next.config.ts",
  "package.json",
  "components/SiteNav.tsx",
  "components/SiteFooter.tsx",
  "components/LoginRequiredBox.tsx",
  "components/LegalDisclaimerBox.tsx",
  "scripts/smokeTestLocal.cjs",
];

const recommendedFiles = [
  "app/guest/page.tsx",
  "app/levels/page.tsx",
  "app/stats/page.tsx",
  "app/admin/launch-check/page.tsx",
  "app/admin/activity/page.tsx",
  "lib/friendlyError.ts",
  "docs/legal-checklist.md",
  "docs/market-analysis.md",
  "docs/mobile-qa-checklist.md",
];

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const recommendedEnv = [
  "NEXT_PUBLIC_SITE_URL",
];

function loadDotEnvLocal() {
  const envPath = path.join(root, ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function maskValue(value) {
  if (!value) return "missing";

  if (value.length <= 8) {
    return "set";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function readPackageJson() {
  const packagePath = path.join(root, "package.json");

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function checkFiles() {
  console.log("\nFiles\n");

  let failed = 0;

  for (const file of requiredFiles) {
    if (exists(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      failed += 1;
    }
  }

  for (const file of recommendedFiles) {
    if (exists(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`⚠️  ${file}`);
    }
  }

  return failed;
}

function checkEnv() {
  console.log("\nEnvironment\n");

  let failed = 0;

  for (const key of requiredEnv) {
    const value = process.env[key];

    if (value) {
      console.log(`✅ ${key}=${maskValue(value)}`);
    } else {
      console.log(`❌ ${key}=missing`);
      failed += 1;
    }
  }

  for (const key of recommendedEnv) {
    const value = process.env[key];

    if (value) {
      console.log(`✅ ${key}=${maskValue(value)}`);
    } else {
      console.log(`⚠️  ${key}=missing`);
    }
  }

  return failed;
}

function checkPackageScripts() {
  console.log("\nPackage scripts\n");

  const packageJson = readPackageJson();

  if (!packageJson) {
    console.log("❌ package.json missing");
    return 1;
  }

  const scripts = packageJson.scripts || {};
  const requiredScripts = ["dev", "build", "smoke", "smoke:dev", "preflight"];

  let failed = 0;

  for (const script of requiredScripts) {
    if (scripts[script]) {
      console.log(`✅ npm run ${script}`);
    } else {
      console.log(`❌ npm run ${script}`);
      failed += 1;
    }
  }

  return failed;
}

function checkGitIgnoredEnv() {
  console.log("\nGit safety\n");

  const gitignorePath = path.join(root, ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    console.log("⚠️  .gitignore missing");
    return 0;
  }

  const gitignore = fs.readFileSync(gitignorePath, "utf8");

  if (
    gitignore.includes(".env.local") ||
    gitignore.includes(".env*.local")
  ) {
    console.log("✅ .env.local is ignored");
  } else {
    console.log("⚠️  .env.local is not explicitly ignored");
  }

  if (exists(".env.local")) {
    console.log("✅ .env.local exists locally");
  } else {
    console.log("⚠️  .env.local missing locally");
  }

  return 0;
}

function main() {
  loadDotEnvLocal();

  console.log("\nPromoPtaha preflight check");
  console.log("-------------------------");

  let failed = 0;

  failed += checkFiles();
  failed += checkEnv();
  failed += checkPackageScripts();
  failed += checkGitIgnoredEnv();

  console.log("\n-------------------------");

  if (failed === 0) {
    console.log("✅ Preflight OK. Критичних проблем не знайдено.");
    process.exit(0);
  }

  console.log(`❌ Preflight failed. Критичних проблем: ${failed}`);
  process.exit(1);
}

main();
