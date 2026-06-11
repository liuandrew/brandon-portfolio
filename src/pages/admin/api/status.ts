import type { APIRoute } from "astro";
import { hasChanges, getChanged } from "../../../../scripts/github-publish.mjs";

export const GET: APIRoute = async () => {
  const changes = getChanged();
  return new Response(
    JSON.stringify({
      hasChanges: hasChanges(),
      fileCount: changes.length,
      files: changes,
      patConfigured: !!process.env.GITHUB_PAT,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
