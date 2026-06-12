import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  client: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),
  ndaLocked: z.boolean(),
  portfolioLocked: z.boolean().default(false),
  portfolioTitle: z.string().optional(),
  logo: z.string().optional(),
  heroImage: z.string(),
  images: z.array(
    z.union([
      z.string(),
      z.object({ src: z.string(), description: z.string().optional() }),
    ])
  ),
  layout: z.enum(["standard", "masonry"]).optional(),
  footer: z.string().optional(),
});

const homepageSchema = z.object({
  images: z.array(z.string()),
});

const personalSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  images: z.array(
    z.union([
      z.string(),
      z.object({ src: z.string(), description: z.string().optional() }),
    ])
  ),
});

const portfolioSchema = z.object({
  projects: z.array(
    z.union([
      z.string(),
      z.object({
        slug: z.string(),
        images: z.array(z.string()).optional(),
      }),
    ])
  ),
});

const projectsNavSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      projects: z.array(
        z.union([
          z.string(),
          z.object({ slug: z.string(), name: z.string() }),
        ])
      ),
    })
  ),
});

const schemas = {
  projects: projectsSchema,
  homepage: homepageSchema,
  personal: personalSchema,
  portfolio: portfolioSchema,
  projectsNav: projectsNavSchema,
};

function imagePathsFromData(data) {
  const paths = [];
  if (!data || typeof data !== "object") return paths;
  for (const [key, val] of Object.entries(data)) {
    if (key === "tags" || key === "sections" || key === "projects") continue;
    if (typeof val === "string" && val.includes("src/assets/")) {
      paths.push(val);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "string" && item.includes("src/assets/")) {
          paths.push(item);
        } else if (typeof item === "object" && item !== null && typeof item.src === "string" && item.src.includes("src/assets/")) {
          paths.push(item.src);
        }
      }
    }
  }
  return paths;
}

export function validateCollection(collectionName, data) {
  const schema = schemas[collectionName];
  if (!schema) return { valid: true, errors: [] };

  const result = schema.safeParse(data);
  const errors = [];

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "(root)";
      errors.push(`${field}: ${issue.message}`);
    }
  }

  const imagePaths = imagePathsFromData(data);
  for (const imgPath of imagePaths) {
    const abs = resolve(ROOT, imgPath);
    if (!existsSync(abs)) {
      errors.push(`Image not found: ${imgPath}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAllCollections(allData) {
  const allErrors = {};
  for (const [name, collection] of Object.entries(allData)) {
    if (!collection) continue;
    if (name === "projects") {
      for (const [slug, entry] of Object.entries(collection)) {
        const result = validateCollection("projects", entry.data);
        if (!result.valid) {
          allErrors[`projects/${slug}`] = result.errors;
        }
      }
    } else {
      const result = validateCollection(name, collection.data);
      if (!result.valid) {
        allErrors[name] = result.errors;
      }
    }
  }
  return allErrors;
}
