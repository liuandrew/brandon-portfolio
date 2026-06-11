import { readFileSync, existsSync } from "fs";
import { spawn } from "child_process";
import { createServer } from "net";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

const CWD = root;
const PORT = 4321;
const ADMIN_URL = `http://localhost:${PORT}/admin`;

function loadEnv() {
  if (!existsSync(envPath)) {
    console.log("[admin] No .env file found — skipping token load");
    return;
  }
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = val;
  }
  const token = process.env.GITHUB_PAT;
  if (token) {
    console.log(`[admin] GITHUB_PAT found (${token.length} chars) — ready to publish`);
  } else {
    console.log("[admin] GITHUB_PAT not set — publish will be unavailable");
  }
}

function waitForPort(port, host = "127.0.0.1") {
  return new Promise((resolve_) => {
    const tryConnect = () => {
      const sock = createServer();
      sock.on("error", () => {
        setTimeout(tryConnect, 300);
      });
      sock.on("listening", () => {
        sock.close();
        resolve_();
      });
      sock.listen(port, host);
    };
    tryConnect();
  });
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? ["open", [url]]
      : platform === "win32"
        ? ["cmd", ["/c", "start", url]]
        : ["xdg-open", [url]];
  spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref();
}

loadEnv();

const child = spawn("npx", ["astro", "dev", "--host", "--port", String(PORT)], {
  cwd: CWD,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

console.log(`[admin] Waiting for server on port ${PORT}...`);
waitForPort(PORT).then(() => {
  console.log(`[admin] Server ready at ${ADMIN_URL}`);
  openBrowser(ADMIN_URL);
});
