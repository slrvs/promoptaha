const fs = require("fs");
const path = require("path");

const root = process.cwd();

const files = [
  "app/add/page.tsx",
  "app/request-store/page.tsx",
  "app/codes/[id]/CodeDetailsClient.tsx",
  "app/profile/page.tsx",
  "app/admin/users/[id]/page.tsx",
];

for (const file of files) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const before = content;

  content = content.replace(/^\uFEFF/, "");

  const hasUseClient =
    content.includes('"use client";') || content.includes("'use client';");

  if (!hasUseClient) {
    console.log(`NO USE CLIENT: ${file}`);
    continue;
  }

  content = content
    .replace(/^\s*["']use client["'];\s*/m, "")
    .trimStart();

  content = `"use client";\n\n${content}`;

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`FIXED: ${file}`);
  } else {
    console.log(`NO CHANGES: ${file}`);
  }
}