import { describe, expect, it } from "bun:test";
import { getAstroPosthogConfig, getReactPosthogConfig } from "../src/client";

describe("posthog client", () => {
   const mockEnv = {
      VITE_POSTHOG_HOST: "https://us.i.posthog.com",
      VITE_POSTHOG_KEY: "phc_test_key_123",
   };

   describe("getReactPosthogConfig", () => {
      it("should return config with api_host and api_key", () => {
         const config = getReactPosthogConfig(mockEnv);

         expect(config).toEqual({
            api_host: "https://us.i.posthog.com",
            api_key: "phc_test_key_123",
            autocapture: true,
            capture_pageleave: true,
            capture_pageview: false,
            capture_performance: true,
         });
      });

      it("should use values from env parameter", () => {
         const customEnv = {
            VITE_POSTHOG_HOST: "https://eu.posthog.com",
            VITE_POSTHOG_KEY: "phc_custom_key",
         };

         const config = getReactPosthogConfig(customEnv);

         expect(config.api_host).toBe("https://eu.posthog.com");
         expect(config.api_key).toBe("phc_custom_key");
      });

      it("should handle self-hosted posthog URLs", () => {
         const selfHostedEnv = {
            VITE_POSTHOG_HOST: "https://analytics.mycompany.com",
            VITE_POSTHOG_KEY: "phc_self_hosted",
         };

         const config = getReactPosthogConfig(selfHostedEnv);

         expect(config.api_host).toBe("https://analytics.mycompany.com");
      });

      it("should disable automatic pageview capture", () => {
         const config = getReactPosthogConfig(mockEnv);

         expect(config.capture_pageview).toBe(false);
      });

      it("should enable pageleave tracking", () => {
         const config = getReactPosthogConfig(mockEnv);

         expect(config.capture_pageleave).toBe(true);
      });

      it("should enable performance/web vitals capture", () => {
         const config = getReactPosthogConfig(mockEnv);

         expect(config.capture_performance).toBe(true);
      });

      it("should enable autocapture", () => {
         const config = getReactPosthogConfig(mockEnv);

         expect(config.autocapture).toBe(true);
      });
   });

   describe("getAstroPosthogConfig", () => {
      it("should return a string containing the posthog init script", () => {
         const script = getAstroPosthogConfig(mockEnv);

         expect(typeof script).toBe("string");
         expect(script).toContain("posthog.init");
      });

      it("should include the api key in the script", () => {
         const script = getAstroPosthogConfig(mockEnv);

         expect(script).toContain("phc_test_key_123");
      });

      it("should include the api host in the script", () => {
         const script = getAstroPosthogConfig(mockEnv);

         expect(script).toContain("https://us.i.posthog.com");
      });

      it("should include defaults configuration", () => {
         const script = getAstroPosthogConfig(mockEnv);

         expect(script).toContain("defaults: '2025-05-24'");
      });

      it("should use custom env values", () => {
         const customEnv = {
            VITE_POSTHOG_HOST: "https://custom.posthog.com",
            VITE_POSTHOG_KEY: "phc_custom_astro_key",
         };

         const script = getAstroPosthogConfig(customEnv);

         expect(script).toContain("https://custom.posthog.com");
         expect(script).toContain("phc_custom_astro_key");
      });

      it("should contain the posthog loader script", () => {
         const script = getAstroPosthogConfig(mockEnv);

         expect(script).toContain("window.posthog");
         expect(script).toContain("e.__SV");
      });
   });
});
