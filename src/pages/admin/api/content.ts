import type { APIRoute } from "astro";
import {
  readAllCollections,
  readCollection,
  writeCollection,
  createProject,
  deleteProject,
} from "../../../../scripts/content-service.mjs";

export const prerender = false;

export const GET: APIRoute = async ({ request, url: routeUrl }) => {
  const url = new URL(request.url, routeUrl.origin);
  const collection = url.searchParams.get("collection");

  try {
    if (collection) {
      const data = readCollection(collection);
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const all = readAllCollections();
    return new Response(JSON.stringify({ data: all }), {
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { collection, data, slug } = body;

    if (!collection) {
      return new Response(JSON.stringify({ error: "collection is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (collection === "projects" && slug) {
      createProject(slug, data);
    } else {
      writeCollection(collection, data);
    }

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

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: "slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deleted = deleteProject(slug);
    return new Response(JSON.stringify({ success: deleted }), {
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
