import type { APIRoute } from "astro";
import { publish } from "../../../../scripts/github-publish.mjs";

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const result = await publish();
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
