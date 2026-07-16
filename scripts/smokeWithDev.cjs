const { spawn, spawnSync } = require("child_process");

const candidateBaseUrls = process.env.BASE_URL
  ? [process.env.BASE_URL]
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ];

let devProcess = null;
let startedDevServer = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "PromoPtaha-SmokeDev/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function findWorkingBaseUrl() {
  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/`);

      if (response.status >= 200 && response.status < 500) {
        return baseUrl;
      }
    } catch {
      // Пробуємо наступний варіант
    }
  }

  return null;
}

function startDevServer() {
  startedDevServer = true;

  if (process.platform === "win32") {
    devProcess = spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "npm run dev -- -H localhost -p 3000"],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
        windowsHide: false,
      }
    );

    return;
  }

  devProcess = spawn("npm", ["run", "dev", "--", "-H", "localhost", "-p", "3000"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
}

function stopDevServer() {
  if (!startedDevServer || !devProcess || !devProcess.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(devProcess.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    devProcess.kill("SIGTERM");
  }
}

async function runSmoke(baseUrl) {
  return new Promise((resolve) => {
    let smokeProcess;

    if (process.platform === "win32") {
      smokeProcess = spawn("cmd.exe", ["/d", "/s", "/c", "npm run smoke"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          BASE_URL: baseUrl,
        },
        stdio: "inherit",
        windowsHide: false,
      });
    } else {
      smokeProcess = spawn("npm", ["run", "smoke"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          BASE_URL: baseUrl,
        },
        stdio: "inherit",
      });
    }

    smokeProcess.on("close", (code) => {
      resolve(code || 0);
    });
  });
}

async function main() {
  console.log("\nChecking for existing local server...\n");

  let baseUrl = await findWorkingBaseUrl();

  if (!baseUrl) {
    console.log("Local server not found. Starting Next.js dev server...\n");

    startDevServer();

    const maxAttempts = 40;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await sleep(1500);

      baseUrl = await findWorkingBaseUrl();

      if (baseUrl) {
        break;
      }

      console.log(`Waiting for server... ${attempt}/${maxAttempts}`);
    }
  }

  if (!baseUrl) {
    console.log("\n❌ Не вдалося запустити локальний сервер.");
    stopDevServer();
    process.exit(1);
  }

  console.log(`\n✅ Local server ready: ${baseUrl}\n`);

  const code = await runSmoke(baseUrl);

  stopDevServer();

  process.exit(code);
}

process.on("SIGINT", () => {
  stopDevServer();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stopDevServer();
  process.exit(143);
});

main().catch((error) => {
  console.error(error);
  stopDevServer();
  process.exit(1);
});
