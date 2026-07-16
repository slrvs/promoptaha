const baseUrl = process.env.BASE_URL || "http://localhost:3000";

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

async function checkRoute(route) {
  const url = `${baseUrl}${route}`;

  try {
    const response = await fetch(url, {
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
  console.log(`\nSmoke test: ${baseUrl}\n`);

  const results = [];

  for (const route of routes) {
    const result = await checkRoute(route);
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
