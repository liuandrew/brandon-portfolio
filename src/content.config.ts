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

export const collections = { projects };
