import fs from "node:fs/promises";
import fsys from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";
const MAX_SIZE = 10 * 1024 * 1024;

export const UPLOAD_PATH =  path.join(process.cwd(), "uploads");

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
		await fs.mkdir(UPLOAD_PATH, { recursive: true });

		if (fsys.existsSync(filePath)) {
			return new Response(JSON.stringify({ error: "El uuid ya existe, vuelve a intentarlo." }), {
				status: 409,
				headers: { "content-type": "application/json" },
			});
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		await fs.writeFile(filePath, buffer);

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

		if (fsys.existsSync(UPLOAD_PATH + `/${uuid}.schem`)) {
			await fs.unlink(UPLOAD_PATH + `/${uuid}.schem`);
		} else if (fsys.existsSync(UPLOAD_PATH + `/${uuid}.nbt`)) {
			await fs.unlink(UPLOAD_PATH + `/${uuid}.nbt`);
		} else {
			return new Response(JSON.stringify({ error: "Archivo no encontrado" }), {
				status: 302,
				headers: { "content-type": "application/json" },
			});
		}

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
