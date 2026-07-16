const { spawn } = require("child_process");

const liveUrl = process.env.LIVE_URL || "https://promoptaha-iskd.vercel.app";

function runSmokeLive() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run smoke"]
      : ["run", "smoke"];

  const smokeProcess = spawn(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BASE_URL: liveUrl,
    },
    stdio: "inherit",
  });

  smokeProcess.on("close", (code) => {
    process.exit(code || 0);
  });
}

console.log(`\nLive smoke test: ${liveUrl}\n`);
runSmokeLive();
