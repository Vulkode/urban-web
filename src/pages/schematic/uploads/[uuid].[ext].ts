import { downloadSchematic } from "@/utils/schem-handler";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const { uuid, ext } = params;
	if (!uuid || !ext) {
		return new Response("Not found", { status: 404 });
	}

	try {
		const blob = await downloadSchematic(uuid, ext);
		if (!blob || !blob.file) {
			return new Response("Not found", { status: 404 });
		}

		return new Response(blob.file, {
			status: 200,
			headers: {
				"Content-Type": blob.contentType || "application/octet-stream",
				"Content-Disposition": blob.contentDisposition || `attachment; filename="${uuid}.${ext}"`,
				"Cache-Control": blob.cacheControl || "public, max-age=31536000",
			},
		});
	} catch (err) {
		return new Response("Not found", { status: 404 });
	}
};
