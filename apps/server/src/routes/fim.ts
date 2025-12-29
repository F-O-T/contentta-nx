import { auth } from "../integrations/auth";
import { createFIMStream } from "@packages/fim/server";
import { FIMRequestSchema } from "@packages/fim/schemas";
import { Elysia, t } from "elysia";

export const fimRoutes = new Elysia({ prefix: "/api/fim" }).post(
   "/stream",
   async function*({ body, request }) {
      // Validate session
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
         throw new Error("Unauthorized");
      }

      // Validate input
      const input = FIMRequestSchema.parse(body);

      // Stream completion using async generator
      for await (const chunk of createFIMStream(input)) {
         yield JSON.stringify(chunk) + "\n";
      }
   },
   {
      body: t.Object({
         prefix: t.String(),
         suffix: t.Optional(t.String()),
         contextType: t.Optional(t.String()),
         maxTokens: t.Optional(t.Number()),
         temperature: t.Optional(t.Number()),
         stopSequences: t.Optional(t.Array(t.String())),
      }),
   },
);
