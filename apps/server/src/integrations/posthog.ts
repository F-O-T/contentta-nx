import { serverEnv } from "@packages/environment/server";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
import { Elysia } from "elysia";

export const posthog = getElysiaPosthogConfig(serverEnv);
export const posthogPlugin = new Elysia({
   name: "posthog-plugin",
})
   .derive(() => ({
      posthog,
   }))
   .onStop(async () => {
      await posthog.shutdown();
      console.info("PostHog client shut down.");
   });
