import { existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname, extname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import sharp from "sharp";
import { markChanged, clearChanged, getChanged, hasChanges } from "./admin-state.mjs";
import { readAllCollections, readCollection, writeCollection, createProject, deleteProject } from "./content-service.mjs";
import { publish } from "./github-publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ASSETS = resolve(ROOT, "src", "assets");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);
const MIME_MAP = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif",
};

const thumbnailCache = new Map();

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, message, status = 500) {
  sendJson(res, { error: message }, status);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", () => resolve(body));
  });
}

function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host || "localhost"}`);
}

function collectAssets(dir, baseDir, byDir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectAssets(full, baseDir, byDir);
      const relDir = relative(ROOT, full);
      const subDir = relDir.replace(/^src\/assets\/?/, "") || "general";
      if (!byDir[subDir]) byDir[subDir] = [];
    } else if (entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      const rel = relative(ROOT, full);
      const sub = dirname(rel).replace(/^src\/assets\/?/, "") || "general";
      if (!byDir[sub]) byDir[sub] = [];
      byDir[sub].push({ name: entry.name, path: rel });
    }
  }
}

async function handleContent(req, res) {
  const url = parseUrl(req);
  const method = req.method;

  if (method === "GET") {
    const collection = url.searchParams.get("collection");
    if (collection) return sendJson(res, { data: readCollection(collection) });
    return sendJson(res, { data: readAllCollections() });
  }

  if (method === "PUT") {
    const body = JSON.parse(await readBody(req));
    const { collection, data, slug } = body;
    if (!collection) return sendError(res, "collection is required", 400);
    if (collection === "projects" && slug) createProject(slug, data);
    else writeCollection(collection, data);
    return sendJson(res, { success: true });
  }

  if (method === "DELETE") {
    const body = JSON.parse(await readBody(req));
    const { slug } = body;
    if (!slug) return sendError(res, "slug is required", 400);
    const deleted = deleteProject(slug);
    return sendJson(res, { success: deleted });
  }

  sendError(res, "Method not allowed", 405);
}

async function handleLibrary(req, res) {
  const url = parseUrl(req);
  const method = req.method;

  if (method === "GET") {
    const imgPath = url.searchParams.get("img");
    if (imgPath) {
      const abs = resolve(ROOT, imgPath);
      if (!abs.startsWith(ASSETS) || !existsSync(abs)) {
        res.writeHead(404); res.end();
        return;
      }

      const width = parseInt(url.searchParams.get("w") || "0", 10);
      const ext = extname(abs).toLowerCase();

      if (width > 0 && (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".avif")) {
        const cacheKey = `${abs}:${width}`;
        let cached = thumbnailCache.get(cacheKey);
        if (!cached) {
          try {
            cached = await sharp(abs)
              .resize(width)
              .webp({ quality: 70 })
              .toBuffer();
            thumbnailCache.set(cacheKey, cached);
            if (thumbnailCache.size > 500) {
              const firstKey = thumbnailCache.keys().next().value;
              thumbnailCache.delete(firstKey);
            }
          } catch {
            cached = readFileSync(abs);
          }
        }
        res.writeHead(200, { "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600" });
        res.end(cached);
        return;
      }

      const contentType = MIME_MAP[ext] || "application/octet-stream";
      const buf = readFileSync(abs);
      res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
      res.end(buf);
      return;
    }
    const byDir = {};
    collectAssets(ASSETS, ASSETS, byDir);
    return sendJson(res, { byDir });
  }

  if (method === "POST") {
    const body = JSON.parse(await readBody(req));

    if (body.action === "createFolder") {
      const { name } = body;
      if (!name) return sendError(res, "name is required", 400);
      const folderPath = resolve(ASSETS, name);
      if (!folderPath.startsWith(ASSETS)) return sendError(res, "Invalid path", 400);
      if (existsSync(folderPath)) return sendError(res, "Folder already exists", 409);
      mkdirSync(folderPath, { recursive: true });
      return sendJson(res, { success: true });
    }

    const { name, data, subdir = "general" } = body;
    if (!name || !data) return sendError(res, "name and data (base64) are required", 400);

    const targetDir = resolve(ASSETS, subdir);
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    const filePath = resolve(targetDir, name);
    writeFileSync(filePath, Buffer.from(data, "base64"));

    const rel = relative(ROOT, filePath);
    markChanged(rel);
    return sendJson(res, { success: true, path: rel });
  }

  if (method === "DELETE") {
    const body = JSON.parse(await readBody(req));

    if (body.action === "deleteFolder") {
      const { name } = body;
      if (!name) return sendError(res, "name is required", 400);
      const folderPath = resolve(ASSETS, name);
      if (!folderPath.startsWith(ASSETS)) return sendError(res, "Invalid path", 400);
      if (!existsSync(folderPath)) return sendError(res, "Folder not found", 404);
      rmSync(folderPath, { recursive: true, force: true });
      markChanged(`src/assets/${name}`);
      return sendJson(res, { success: true });
    }

    const { path: fileRelPath } = body;
    if (!fileRelPath) return sendError(res, "path is required", 400);
    const abs = resolve(ROOT, fileRelPath);
    if (!abs.startsWith(ASSETS)) return sendError(res, "Invalid path", 400);
    if (!existsSync(abs)) return sendError(res, "File not found", 404);
    unlinkSync(abs);
    markChanged(fileRelPath);
    return sendJson(res, { success: true });
  }

  sendError(res, "Method not allowed", 405);
}

async function handleStatus(req, res) {
  const changes = getChanged();
  sendJson(res, {
    hasChanges: hasChanges(),
    fileCount: changes.length,
    files: changes,
    patConfigured: !!process.env.GITHUB_PAT,
  });
}

async function handlePublish(req, res) {
  try {
    const result = await publish();
    sendJson(res, result, result.success ? 200 : 400);
  } catch (e) {
    sendJson(res, { success: false, error: e.message }, 500);
  }
}

function handleRevert(req, res) {
  try {
    const files = getChanged();
    if (files.length === 0) {
      return sendJson(res, { success: false, error: "No changes to revert" }, 400);
    }
    execSync("git checkout -- . && git clean -fd src/assets/", { cwd: ROOT, encoding: "utf-8" });
    clearChanged();
    sendJson(res, { success: true, revertedCount: files.length });
  } catch (e) {
    sendJson(res, { success: false, error: e.message }, 500);
  }
}

export function adminApiPlugin() {
  return {
    name: "admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = parseUrl(req).pathname;

        if (url === "/admin/api/content") return handleContent(req, res);
        if (url === "/admin/api/library") return handleLibrary(req, res);
        if (url === "/admin/api/status") return handleStatus(req, res);
        if (url === "/admin/api/publish") return handlePublish(req, res);
        if (url === "/admin/api/revert") return handleRevert(req, res);

        next();
      });
    },
  };
}
