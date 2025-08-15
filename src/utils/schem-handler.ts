import { del, head, put } from "@vercel/blob";
import type { APIRoute } from "astro";

import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();

const BLOB_READ_WRITE_TOKEN = import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
const MAX_SIZE = 4 * 1024 * 1024;

export const UPLOAD_PATH = "schematic/uploads";

export const UPLOAD_SCHEMATIC: APIRoute = async ({ request }) => {
	try {
		const contentType = request.headers.get("content-type") || "";

		if (!contentType.includes("multipart/form-data")) {
			return new Response(JSON.stringify({ error: "Content-Type inválido" }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}

		const url = new URL(request.url);
		let uuid = url.searchParams.keys().next().value || null;

		const form = await request.formData();
		const file = form.get("schematicFile") || form.get("file");

		if (!(file instanceof File)) {
			return new Response(JSON.stringify({ error: "Archivo faltante" }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}

		const name = file.name || "";
		if (!/\.(schem|nbt)$/i.test(name)) {
			return new Response(JSON.stringify({ error: "Tipo de archivo no soportado" }), {
				status: 415,
				headers: { "content-type": "application/json" },
			});
		}

		if (file.size > MAX_SIZE) {
			return new Response(JSON.stringify({ error: "El archivo excede el tamaño máximo permitido" }), {
				status: 413,
				headers: { "content-type": "application/json" },
			});
		}
		if (!uuid || uuid.trim().length === 0) {
			uuid = crypto.randomUUID();
		}

		const extName = name.split(".").pop();
		const filePath = `${UPLOAD_PATH}/${uuid}.${extName}`;

		try {
			const fileExists = await head(filePath, { token: BLOB_READ_WRITE_TOKEN });

			if (fileExists?.pathname) {
				return new Response(JSON.stringify({ error: "El uuid ya existe, vuelve a intentarlo." }), {
					status: 409,
					headers: { "content-type": "application/json" },
				});
			}
		} catch (error) {}

		const buffer = Buffer.from(await file.arrayBuffer());
		try {
			await put(filePath, buffer, { token: BLOB_READ_WRITE_TOKEN, access: "public" });
		} catch (error) {
			throw new Error("Error al subir el archivo al almacenamiento.");
		}

		return new Response(JSON.stringify({ uuid: uuid }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Error interno" }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
};

export const DELETE_SCHEMATIC: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const uuid = url.searchParams.get("key");

		if (!uuid) {
			return new Response(JSON.stringify({ error: "UUID faltante" }), {
				status: 404,
				headers: { "content-type": "application/json" },
			});
		}
		try {
			await del(UPLOAD_PATH + `/${uuid}.schem`, { token: BLOB_READ_WRITE_TOKEN });
		} catch (error) {}
		try {
			await del(UPLOAD_PATH + `/${uuid}.nbt`, { token: BLOB_READ_WRITE_TOKEN });
		} catch (error) {}

		return new Response(null, {
			status: 204,
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || "Error interno" }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
};

export async function downloadSchematic(uuid: string, ext: string = "schem") {
	try {
		const blob = await head(UPLOAD_PATH + `/${uuid}.${ext}`, { token: BLOB_READ_WRITE_TOKEN });

		const fileRes = await fetch(blob.downloadUrl);
		if (!fileRes.ok) {
			return null;
		}
		return { ...blob, file: fileRes.body };
	} catch (error) {
		return null;
	}
}

export async function getSchemUrl(uuid: string) {
	try {
		const { pathname } = await head(UPLOAD_PATH + `/${uuid}.schem`, { token: BLOB_READ_WRITE_TOKEN });
		return pathname;
	} catch (error) {}

	try {
		const { pathname } = await head(UPLOAD_PATH + `/${uuid}.nbt`, { token: BLOB_READ_WRITE_TOKEN });
		return pathname;
	} catch (error) {}

	return null;
}
