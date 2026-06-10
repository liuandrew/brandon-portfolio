import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      client: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()),
      ndaLocked: z.boolean(),
      portfolioTitle: z.string().optional(),
      logo: image().optional(),
      heroImage: image(),
      images: z.array(image()),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/portfolio" }),
  schema: z.object({
    projects: z.array(
      z.union([
        z.string(),
        z.object({
          slug: z.string(),
          images: z.array(z.string()).optional(),
        }),
      ])
    ),
  }),
});

const homepage = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/homepage" }),
  schema: ({ image }) =>
    z.object({
      images: z.array(image()),
    }),
});

const personal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/personal" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.coerce.date(),
      image: image(),
    }),
});

const projectsNav = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects-nav" }),
  schema: z.object({
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
  }),
});

export const collections = { projects, portfolio, homepage, personal, projectsNav };
