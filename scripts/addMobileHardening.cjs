const fs = require("fs");
const path = require("path");

function updateGlobalsCss() {
  const filePath = path.join(process.cwd(), "app", "globals.css");

  if (!fs.existsSync(filePath)) {
    console.log("SKIP: app/globals.css not found");
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("/* PromoPtaha mobile hardening */")) {
    console.log("OK: globals.css already has mobile hardening");
    return;
  }

  content += `

/* PromoPtaha mobile hardening */
html,
body {
  max-width: 100%;
  overflow-x: clip;
}

body {
  min-height: 100vh;
}

img,
svg,
video,
canvas {
  max-width: 100%;
}

img,
video {
  height: auto;
}

button,
input,
select,
textarea {
  font: inherit;
}

input,
select,
textarea {
  max-width: 100%;
}

pre,
code {
  max-width: 100%;
  overflow-x: auto;
}

table {
  max-width: 100%;
}

@media (max-width: 640px) {
  h1,
  h2,
  h3,
  p,
  a,
  button,
  span,
  div {
    overflow-wrap: anywhere;
  }
}
`;

  fs.writeFileSync(filePath, content, "utf8");
  console.log("UPDATED: app/globals.css");
}

function updateLayoutViewport() {
  const filePath = path.join(process.cwd(), "app", "layout.tsx");

  if (!fs.existsSync(filePath)) {
    console.log("SKIP: app/layout.tsx not found");
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  if (!content.includes("Viewport")) {
    content = content.replace(
      'import type { Metadata } from "next";',
      'import type { Metadata, Viewport } from "next";'
    );
  }

  if (content.includes("export const viewport")) {
    console.log("OK: app/layout.tsx already has viewport");
    fs.writeFileSync(filePath, content, "utf8");
    return;
  }

  const viewportBlock = `
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};
`;

  if (content.includes("export const metadata")) {
    content = content.replace(
      "export const metadata",
      `${viewportBlock}
export const metadata`
    );
  } else {
    content += `\n${viewportBlock}\n`;
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("UPDATED: app/layout.tsx");
}

function updatePreflight() {
  const filePath = path.join(process.cwd(), "scripts", "preflight.cjs");

  if (!fs.existsSync(filePath)) {
    console.log("SKIP: scripts/preflight.cjs not found");
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  const filesToAdd = [
    "docs/mobile-qa-checklist.md",
    "docs/market-analysis.md",
    "docs/legal-checklist.md",
  ];

  for (const file of filesToAdd) {
    if (content.includes(`"${file}"`)) {
      continue;
    }

    content = content.replace(
      '"lib/friendlyError.ts",',
      `"lib/friendlyError.ts",\n  "${file}",`
    );
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("UPDATED: scripts/preflight.cjs");
}

updateGlobalsCss();
updateLayoutViewport();
updatePreflight();

console.log("");
console.log("Done. Now run:");
console.log("npm run launch:check");
