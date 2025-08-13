import { DELETE_SCHEMATIC } from "@/utils/schem-handler";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = DELETE_SCHEMATIC;
export const POST: APIRoute = DELETE_SCHEMATIC;

export const PUT: APIRoute = async () =>
    new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "content-type": "application/json" } });
export const PATCH: APIRoute = PUT;
export const DELETE: APIRoute = PUT;
