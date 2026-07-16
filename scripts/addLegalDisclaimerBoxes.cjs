const fs = require("fs");
const path = require("path");

function updateFile(relativePath, variant) {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${relativePath} not found`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes('import LegalDisclaimerBox from "@/components/LegalDisclaimerBox";')) {
    const importLine = 'import LegalDisclaimerBox from "@/components/LegalDisclaimerBox";';

    const useClientMatch = content.match(/^["']use client["'];\r?\n/);

    if (useClientMatch) {
      content = content.replace(
        useClientMatch[0],
        `${useClientMatch[0]}\n${importLine}\n`
      );
    } else {
      content = `${importLine}\n${content}`;
    }
  }

  if (content.includes("<LegalDisclaimerBox")) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`OK: ${relativePath} already has disclaimer`);
    return;
  }

  if (!content.includes("</main>")) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`WARN: ${relativePath} import added, but </main> not found`);
    console.log("Paste this file later if we need to place the box manually.");
    return;
  }

  const box = `
        <LegalDisclaimerBox
          variant="${variant}"
          className="mx-auto mt-8 max-w-6xl"
        />
`;

  content = content.replace(/(\s*)<\/main>/, `${box}$1</main>`);

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`UPDATED: ${relativePath}`);
}

updateFile("app/codes/[id]/CodeDetailsClient.tsx", "promo");
updateFile("app/stores/[slug]/StoreDetailsClient.tsx", "store");

function updatePreflight() {
  const filePath = path.join(process.cwd(), "scripts", "preflight.cjs");

  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes('"components/LegalDisclaimerBox.tsx"')) {
    console.log("OK: preflight already has LegalDisclaimerBox");
    return;
  }

  content = content.replace(
    '"components/LoginRequiredBox.tsx",',
    '"components/LoginRequiredBox.tsx",\n  "components/LegalDisclaimerBox.tsx",'
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log("UPDATED: scripts/preflight.cjs");
}

updatePreflight();

console.log("");
console.log("Done. Now run:");
console.log("npm run launch:check");
