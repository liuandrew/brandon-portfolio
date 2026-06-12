import type { APIRoute } from "astro";
import { readdirSync, existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname, extname, relative } from "path";
import { fileURLToPath } from "url";
import { markChanged } from "../../../../scripts/admin-state.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..", "..");
const ASSETS = resolve(ROOT, "src", "assets");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);

const MIME_MAP = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export const prerender = false;

export const GET: APIRoute = async ({ request, url: routeUrl }) => {
  try {
    const url = new URL(request.url, routeUrl.origin);
    const imgPath = url.searchParams.get("img");

    if (imgPath) {
      const abs = resolve(ROOT, imgPath);
      if (!abs.startsWith(ASSETS) || !existsSync(abs)) {
        return new Response(null, { status: 404 });
      }
      const ext = extname(abs).toLowerCase();
      const contentType = MIME_MAP[ext] || "application/octet-stream";
      const buf = readFileSync(abs);
      return new Response(buf, {
        status: 200,
        headers: { "Content-Type": contentType, "Cache-Control": "no-cache" },
      });
    }

    // Return listing
    const byDir = {};
    collectInto(ASSETS, ASSETS, byDir);
    return new Response(JSON.stringify({ byDir }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function collectInto(dir, baseDir, byDir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectInto(full, baseDir, byDir);
    } else if (entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      const rel = relative(ROOT, full);
      const sub = dirname(rel).replace(/^src\/assets\/?/, "") || "general";
      if (!byDir[sub]) byDir[sub] = [];
      byDir[sub].push({ name: entry.name, path: rel });
    }
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const subdir = formData.get("subdir") || "general";

    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetDir = resolve(ASSETS, subdir);
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    const fileName = file.name;
    const filePath = resolve(targetDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    const rel = relative(ROOT, filePath);
    markChanged(rel);

    return new Response(JSON.stringify({ success: true, path: rel }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { path: fileRelPath } = body;
    if (!fileRelPath) {
      return new Response(JSON.stringify({ error: "path is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const abs = resolve(ROOT, fileRelPath);
    if (!abs.startsWith(ASSETS)) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!existsSync(abs)) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    unlinkSync(abs);
    markChanged(fileRelPath);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
