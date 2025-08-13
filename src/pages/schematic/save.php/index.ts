import { UPLOAD_SCHEMATIC } from "@/utils/schem-handler";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = UPLOAD_SCHEMATIC;

export const GET: APIRoute = async () =>
	new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "content-type": "application/json" } });
export const PUT: APIRoute = GET;
export const PATCH: APIRoute = GET;
export const DELETE: APIRoute = GET;
