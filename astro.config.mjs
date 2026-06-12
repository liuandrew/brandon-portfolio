// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      process.env.ADMIN && (await import('./scripts/admin-vite-plugin.mjs')).adminApiPlugin(),
    ].filter(Boolean),
  },
});
