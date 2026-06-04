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
      heroImage: image(),
      images: z.array(image()),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/portfolio" }),
  schema: ({ image }) =>
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("project"),
        project: z.string(),
        overrideImage: image().optional(),
      }),
      z.object({
        type: z.literal("standalone"),
        image: image(),
        title: z.string(),
        caption: z.string().optional(),
        link: z.string(),
      }),
    ]),
});

const homepage = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/homepage" }),
  schema: ({ image }) =>
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("project"),
        project: z.string(),
        overrideImage: image().optional(),
      }),
      z.object({
        type: z.literal("standalone"),
        image: image(),
        title: z.string(),
        caption: z.string().optional(),
        link: z.string(),
      }),
    ]),
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

export const collections = { projects, portfolio, homepage, personal };
