import { auth } from "../integrations/auth";
import { createEditStream } from "@packages/edit/server";
import { EditRequestSchema } from "@packages/edit/schemas";
import { Elysia, t } from "elysia";

export const editRoutes = new Elysia({ prefix: "/api/edit" }).post(
	"/stream",
	async function* ({ body, request }) {
		// Validate session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			throw new Error("Unauthorized");
		}

		// Validate input
		const input = EditRequestSchema.parse(body);

		// Stream edit using async generator
		for await (const chunk of createEditStream(input)) {
			yield JSON.stringify(chunk) + "\n";
		}
	},
	{
		body: t.Object({
			selectedText: t.String(),
			instruction: t.String(),
			contextBefore: t.Optional(t.String()),
			contextAfter: t.Optional(t.String()),
			maxTokens: t.Optional(t.Number()),
			temperature: t.Optional(t.Number()),
		}),
	},
);
