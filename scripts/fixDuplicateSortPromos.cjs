const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "app", "codes", "page.tsx");

let content = fs.readFileSync(filePath, "utf8");

function removeDuplicateFunction(source, functionName) {
  const marker = `function ${functionName}(`;
  const indexes = [];

  let index = source.indexOf(marker);

  while (index !== -1) {
    indexes.push(index);
    index = source.indexOf(marker, index + marker.length);
  }

  if (indexes.length <= 1) {
    console.log(`OK: ${functionName} не дублюється`);
    return source;
  }

  console.log(`FOUND: ${functionName} дублюється ${indexes.length} рази`);

  // Залишаємо першу функцію, видаляємо всі наступні дублікати.
  let result = source;

  for (let i = indexes.length - 1; i >= 1; i--) {
    const start = indexes[i];

    let braceStart = result.indexOf("{", start);

    if (braceStart === -1) {
      continue;
    }

    let depth = 0;
    let end = -1;

    for (let position = braceStart; position < result.length; position++) {
      const char = result[position];

      if (char === "{") {
        depth += 1;
      }

      if (char === "}") {
        depth -= 1;

        if (depth === 0) {
          end = position + 1;
          break;
        }
      }
    }

    if (end === -1) {
      continue;
    }

    result = result.slice(0, start) + result.slice(end);
    console.log(`REMOVED duplicate: ${functionName}`);
  }

  return result;
}

content = removeDuplicateFunction(content, "sortPromos");

fs.writeFileSync(filePath, content, "utf8");

console.log("Done. Now run: npm run build");
