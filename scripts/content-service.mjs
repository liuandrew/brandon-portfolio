import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { markChanged } from "./admin-state.mjs";
import { validateCollection } from "./validate-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_CONTENT = resolve(ROOT, "src", "content");

const COLLECTION_META = {
  homepage: {
    type: "single",
    file: "homepage/homepage.md",
    keyField: null,
  },
  portfolio: {
    type: "single",
    file: "portfolio/portfolio.md",
    keyField: null,
  },
  personal: {
    type: "single",
    file: "personal/personal.md",
    keyField: null,
  },
  projects: {
    type: "multi",
    dir: "projects",
    keyField: "slug",
  },
  projectsNav: {
    type: "single",
    file: "projects-nav/projects-nav.md",
    keyField: null,
  },
};

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n?---\s*\n?/);
  if (!match) return { data: {}, content: "" };
  const data = yaml.load(match[1]) || {};
  const body = text.slice(match[0].length);
  return { data, content: body };
}

function serializeFrontmatter(data) {
  const cleaned = structuredClone(data);
  for (const [key, val] of Object.entries(cleaned)) {
    if (val instanceof Date) {
      cleaned[key] = val.toISOString().split("T")[0];
    }
  }
  const frontmatter = yaml.dump(cleaned, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
    sortKeys: false,
  });
  return `---\n${frontmatter}---\n`;
}

function mdFilePath(collectionName) {
  const meta = COLLECTION_META[collectionName];
  if (!meta || meta.type !== "single") return null;
  return resolve(SRC_CONTENT, meta.file);
}

export function getCollectionPath(collectionName) {
  const meta = COLLECTION_META[collectionName];
  if (!meta) return null;
  if (meta.type === "single") return mdFilePath(collectionName);
  return resolve(SRC_CONTENT, meta.dir);
}

export function readCollection(collectionName) {
  const meta = COLLECTION_META[collectionName];
  if (!meta) throw new Error(`Unknown collection: ${collectionName}`);

  if (meta.type === "single") {
    const fp = mdFilePath(collectionName);
    if (!existsSync(fp)) return null;
    const raw = readFileSync(fp, "utf-8");
    const { data, content } = parseFrontmatter(raw);
    return { data, body: content, filePath: fp };
  }

  const dir = resolve(SRC_CONTENT, meta.dir);
  if (!existsSync(dir)) return {};
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const result = {};
  for (const file of files) {
    const fp = resolve(dir, file);
    const raw = readFileSync(fp, "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const slug = basename(file, extname(file));
    result[slug] = { data, body: content, slug, filePath: fp, fileName: file };
  }
  return result;
}

export function readAllCollections() {
  const result = {};
  for (const name of Object.keys(COLLECTION_META)) {
    result[name] = readCollection(name);
  }
  return result;
}

export function writeCollection(collectionName, data, options = {}) {
  const meta = COLLECTION_META[collectionName];
  if (!meta) throw new Error(`Unknown collection: ${collectionName}`);

  const validation = validateCollection(collectionName, data);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
  }

  if (meta.type === "single") {
    const fp = mdFilePath(collectionName);
    const text = serializeFrontmatter(data);
    writeFileSync(fp, text, "utf-8");
    const rel = fp.replace(ROOT + "/", "");
    markChanged(rel);
    return { filePath: rel };
  }

  if (meta.type === "multi") {
    const slug = options.slug;
    if (!slug) throw new Error("slug required for multi-file collection");
    const filePath = resolve(SRC_CONTENT, meta.dir, `${slug}.md`);
    const text = serializeFrontmatter(data);
    writeFileSync(filePath, text, "utf-8");
    const rel = filePath.replace(ROOT + "/", "");
    markChanged(rel);
    return { filePath: rel };
  }
}

export function createProject(slug, data) {
  return writeCollection("projects", data, { slug });
}

export function deleteProject(slug) {
  const fp = resolve(SRC_CONTENT, "projects", `${slug}.md`);
  if (!existsSync(fp)) return false;
  const rel = fp.replace(ROOT + "/", "");
  unlinkSync(fp);
  markChanged(rel);
  return true;
}

function extractImagePaths(data) {
  const paths = [];
  if (!data || typeof data !== "object") return paths;
  for (const val of Object.values(data)) {
    if (typeof val === "string" && val.includes("src/assets/")) {
      paths.push(val);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string" && item.includes("src/assets/")) {
          paths.push(item);
        }
      }
    }
  }
  return paths;
}

export function getReferencedImages() {
  const refs = new Set();
  const all = readAllCollections();
  for (const [name, collection] of Object.entries(all)) {
    if (!collection) continue;
    if (name === "projects") {
      for (const entry of Object.values(collection)) {
        const imgs = extractImagePaths(entry.data);
        imgs.forEach((p) => refs.add(p));
        for (const img of (entry.data.images || [])) {
          if (typeof img === "string") refs.add(img);
        }
        if (entry.data.heroImage) refs.add(entry.data.heroImage);
        if (entry.data.logo) refs.add(entry.data.logo);
      }
    } else {
      const imgs = extractImagePaths(collection.data);
      imgs.forEach((p) => refs.add(p));
      if (collection.data?.images) {
        for (const img of collection.data.images) {
          if (typeof img === "string") refs.add(img);
        }
      }
    }
  }
  return [...refs];
}
