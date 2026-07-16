const routes = [
  "/",
  "/codes",
  "/stores",
  "/deals",
  "/users",
  "/levels",
  "/guest",
  "/stats",
  "/about",
  "/rules",
  "/privacy",
  "/contact",
  "/add",
  "/request-store",
  "/profile",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
];

const candidateBaseUrls = process.env.BASE_URL
  ? [process.env.BASE_URL]
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function findWorkingBaseUrl() {
  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "PromoPtaha-SmokeTest/1.0",
        },
      });

      if (response.status >= 200 && response.status < 500) {
        return baseUrl;
      }
    } catch {
      // Пробуємо наступний варіант
    }
  }

  return null;
}

async function checkRoute(baseUrl, route) {
  const url = `${baseUrl}${route}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "PromoPtaha-SmokeTest/1.0",
      },
    });

    const ok = response.status >= 200 && response.status < 400;

    return {
      route,
      status: response.status,
      ok,
      error: "",
    };
  } catch (error) {
    return {
      route,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("\nSearching local Next.js server...\n");

  const baseUrl = await findWorkingBaseUrl();

  if (!baseUrl) {
    console.log("❌ Не знайшов локальний сервер.");
    console.log("");
    console.log("Запусти сайт в окремому терміналі:");
    console.log("");
    console.log("  cd C:\\Projects\\promoptaha");
    console.log("  npm run dev");
    console.log("");
    console.log("Або примусово на 3000:");
    console.log("");
    console.log("  npm run dev -- -H localhost -p 3000");
    console.log("");
    console.log("Після цього повтори:");
    console.log("");
    console.log("  npm run smoke");
    console.log("");
    process.exit(1);
  }

  console.log(`Smoke test: ${baseUrl}\n`);

  const results = [];

  for (const route of routes) {
    const result = await checkRoute(baseUrl, route);
    results.push(result);

    const icon = result.ok ? "✅" : "❌";
    const status = result.status || "ERR";

    console.log(`${icon} ${status} ${route}${result.error ? ` — ${result.error}` : ""}`);
  }

  const failed = results.filter((result) => !result.ok);

  console.log("\n-----------------------------");

  if (failed.length === 0) {
    console.log("✅ Усе ок. Основні сторінки відповідають нормально.");
    process.exit(0);
  }

  console.log(`❌ Є проблеми: ${failed.length}`);

  for (const result of failed) {
    console.log(`- ${result.route}: ${result.status || result.error}`);
  }

  process.exit(1);
}

main();
