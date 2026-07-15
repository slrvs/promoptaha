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

const importLine =
  'import { getFriendlyErrorMessage } from "@/lib/friendlyError";\n';

function addImport(content) {
  if (content.includes(importLine.trim())) {
    return content;
  }

  const useClientMatch = content.match(/^(\uFEFF?["']use client["'];\s*)/);

  if (useClientMatch) {
    const directive = useClientMatch[1];
    const rest = content.slice(directive.length).trimStart();

    const importRegex = /import[\s\S]*?from ["'][^"']+["'];\n/g;
    const matches = [...rest.matchAll(importRegex)];

    if (matches.length === 0) {
      return `${directive}\n${importLine}${rest}`;
    }

    const lastMatch = matches[matches.length - 1];
    const insertAt = lastMatch.index + lastMatch[0].length;

    return (
      `${directive}\n` +
      rest.slice(0, insertAt) +
      importLine +
      rest.slice(insertAt)
    );
  }

  const importRegex = /import[\s\S]*?from ["'][^"']+["'];\n/g;
  const matches = [...content.matchAll(importRegex)];

  if (matches.length === 0) {
    return importLine + content;
  }

  const lastMatch = matches[matches.length - 1];
  const insertAt = lastMatch.index + lastMatch[0].length;

  return content.slice(0, insertAt) + importLine + content.slice(insertAt);
}

function replaceErrorMessages(content) {
  return content.replace(
    /\$\{([A-Za-z0-9_$.]+)\.message\}/g,
    (_match, errorExpression) => {
      return `\${getFriendlyErrorMessage(${errorExpression})}`;
    }
  );
}

for (const file of files) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const before = content;

  content = addImport(content);
  content = replaceErrorMessages(content);

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`UPDATED: ${file}`);
  } else {
    console.log(`NO CHANGES: ${file}`);
  }
}
