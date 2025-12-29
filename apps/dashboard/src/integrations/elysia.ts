import { treaty } from "@elysiajs/eden";
import { clientEnv } from "@packages/environment/client";
import type { App } from "@server/index";

export const elysia = treaty<App>(clientEnv.VITE_SERVER_URL, {
	fetch: {
		credentials: "include",
	},
});
