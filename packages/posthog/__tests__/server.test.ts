import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import {
   captureError,
   captureServerEvent,
   getAllFeatureFlags,
   getAllFeatureFlagsAndPayloads,
   getElysiaPosthogConfig,
   getFeatureFlag,
   getFeatureFlagPayload,
   identifyUser,
   isFeatureEnabled,
   setGroup,
   shutdownPosthog,
} from "../src/server";

describe("posthog server", () => {
   describe("getElysiaPosthogConfig", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should create a PostHog client instance", () => {
         const client = getElysiaPosthogConfig(mockEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
         expect(typeof client.identify).toBe("function");
         expect(typeof client.shutdown).toBe("function");
      });

      it("should accept different host configurations", () => {
         const euEnv = {
            POSTHOG_HOST: "https://eu.i.posthog.com",
            POSTHOG_KEY: "phc_eu_key_456",
         };

         const client = getElysiaPosthogConfig(euEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
      });

      it("should accept custom self-hosted configurations", () => {
         const selfHostedEnv = {
            POSTHOG_HOST: "https://posthog.mycompany.com",
            POSTHOG_KEY: "phc_self_hosted_key",
         };

         const client = getElysiaPosthogConfig(selfHostedEnv);

         expect(client).toBeDefined();
         expect(typeof client.capture).toBe("function");
      });
   });

   describe("identifyUser", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should call posthog.identify with userId and properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const identifySpy = spyOn(client, "identify");

         identifyUser(client, "user-123", {
            email: "test@example.com",
            name: "Test User",
         });

         expect(identifySpy).toHaveBeenCalledWith({
            distinctId: "user-123",
            properties: { email: "test@example.com", name: "Test User" },
         });
      });

      it("should work with empty properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const identifySpy = spyOn(client, "identify");

         identifyUser(client, "user-456");

         expect(identifySpy).toHaveBeenCalledWith({
            distinctId: "user-456",
            properties: {},
         });
      });

      it("should accept additional custom properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const identifySpy = spyOn(client, "identify");

         identifyUser(client, "user-789", {
            email: "user@test.com",
            plan: "premium",
            signupDate: "2024-01-01",
         });

         expect(identifySpy).toHaveBeenCalledWith({
            distinctId: "user-789",
            properties: {
               email: "user@test.com",
               plan: "premium",
               signupDate: "2024-01-01",
            },
         });
      });
   });

   describe("setGroup", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should call posthog.groupIdentify with organization type", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const groupIdentifySpy = spyOn(client, "groupIdentify");

         setGroup(client, "org-123", { name: "Acme Corp", slug: "acme" });

         expect(groupIdentifySpy).toHaveBeenCalledWith({
            groupKey: "org-123",
            groupType: "organization",
            properties: { name: "Acme Corp", slug: "acme" },
         });
      });

      it("should work with empty properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const groupIdentifySpy = spyOn(client, "groupIdentify");

         setGroup(client, "org-456");

         expect(groupIdentifySpy).toHaveBeenCalledWith({
            groupKey: "org-456",
            groupType: "organization",
            properties: {},
         });
      });
   });

   describe("captureError", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should capture trpc_error event with all properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const captureSpy = spyOn(client, "capture");

         captureError(client, {
            code: "BAD_REQUEST",
            errorId: "error-789",
            input: { amount: -100 },
            message: "Invalid input",
            organizationId: "org-456",
            path: "bills.create",
            userId: "user-123",
         });

         expect(captureSpy).toHaveBeenCalledWith({
            distinctId: "user-123",
            event: "trpc_error",
            properties: {
               $groups: { organization: "org-456" },
               code: "BAD_REQUEST",
               errorId: "error-789",
               input: { amount: -100 },
               message: "Invalid input",
               path: "bills.create",
            },
         });
      });

      it("should work without organizationId", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const captureSpy = spyOn(client, "capture");

         captureError(client, {
            code: "UNAUTHORIZED",
            errorId: "error-abc",
            message: "Invalid credentials",
            path: "auth.login",
            userId: "user-123",
         });

         expect(captureSpy).toHaveBeenCalledWith({
            distinctId: "user-123",
            event: "trpc_error",
            properties: {
               code: "UNAUTHORIZED",
               errorId: "error-abc",
               input: undefined,
               message: "Invalid credentials",
               path: "auth.login",
            },
         });
      });

      it("should include input when provided", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const captureSpy = spyOn(client, "capture");

         captureError(client, {
            code: "NOT_FOUND",
            errorId: "error-def",
            input: { userId: "nonexistent" },
            message: "User not found",
            path: "users.update",
            userId: "user-123",
         });

         expect(captureSpy).toHaveBeenCalledWith(
            expect.objectContaining({
               properties: expect.objectContaining({
                  input: { userId: "nonexistent" },
               }),
            }),
         );
      });
   });

   describe("isFeatureEnabled", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should call posthog.isFeatureEnabled with correct parameters", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const isFeatureEnabledSpy = spyOn(
            client,
            "isFeatureEnabled",
         ).mockResolvedValue(true);

         const result = await isFeatureEnabled(client, "new-dashboard", {
            userId: "user-123",
         });

         expect(isFeatureEnabledSpy).toHaveBeenCalledWith(
            "new-dashboard",
            "user-123",
            {
               groupProperties: undefined,
               groups: undefined,
               personProperties: undefined,
            },
         );
         expect(result).toBe(true);
      });

      it("should return false when feature is not enabled", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         spyOn(client, "isFeatureEnabled").mockResolvedValue(false);

         const result = await isFeatureEnabled(client, "disabled-feature", {
            userId: "user-123",
         });

         expect(result).toBe(false);
      });

      it("should return false when result is undefined", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         spyOn(client, "isFeatureEnabled").mockResolvedValue(undefined);

         const result = await isFeatureEnabled(client, "unknown-feature", {
            userId: "user-123",
         });

         expect(result).toBe(false);
      });

      it("should pass user and group properties", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const isFeatureEnabledSpy = spyOn(
            client,
            "isFeatureEnabled",
         ).mockResolvedValue(true);

         await isFeatureEnabled(client, "org-feature", {
            groupProperties: { organization: { tier: "enterprise" } },
            groups: { organization: "org-456" },
            userId: "user-123",
            userProperties: { plan: "premium" },
         });

         expect(isFeatureEnabledSpy).toHaveBeenCalledWith(
            "org-feature",
            "user-123",
            {
               groupProperties: { organization: { tier: "enterprise" } },
               groups: { organization: "org-456" },
               personProperties: { plan: "premium" },
            },
         );
      });
   });

   describe("getFeatureFlag", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should return feature flag variant", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         spyOn(client, "getFeatureFlag").mockResolvedValue("variant-a");

         const result = await getFeatureFlag(client, "ab-test", {
            userId: "user-123",
         });

         expect(result).toBe("variant-a");
      });

      it("should return boolean for boolean flags", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         spyOn(client, "getFeatureFlag").mockResolvedValue(true);

         const result = await getFeatureFlag(client, "bool-flag", {
            userId: "user-123",
         });

         expect(result).toBe(true);
      });
   });

   describe("getFeatureFlagPayload", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should return feature flag payload", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const payload = { buttonColor: "blue", maxItems: 10 };
         spyOn(client, "getFeatureFlagPayload").mockResolvedValue(payload);

         const result = await getFeatureFlagPayload(
            client,
            "config-flag",
            "user-123",
         );

         expect(result).toEqual(payload);
      });

      it("should accept matchValue parameter", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const getPayloadSpy = spyOn(
            client,
            "getFeatureFlagPayload",
         ).mockResolvedValue({ config: "test" });

         await getFeatureFlagPayload(
            client,
            "ab-test",
            "user-123",
            "variant-b",
         );

         expect(getPayloadSpy).toHaveBeenCalledWith(
            "ab-test",
            "user-123",
            "variant-b",
         );
      });
   });

   describe("getAllFeatureFlags", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should return all feature flags", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const flags = {
            "feature-a": true,
            "feature-b": "variant-1",
            "feature-c": false,
         };
         spyOn(client, "getAllFlags").mockResolvedValue(flags);

         const result = await getAllFeatureFlags(client, {
            userId: "user-123",
         });

         expect(result).toEqual(flags);
      });
   });

   describe("getAllFeatureFlagsAndPayloads", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should return all flags and payloads", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const response = {
            featureFlagPayloads: {
               "feature-a": { config: "value" },
               "feature-b": { items: [1, 2, 3] },
            },
            featureFlags: { "feature-a": true, "feature-b": "variant-1" },
         };
         spyOn(client, "getAllFlagsAndPayloads").mockResolvedValue(response);

         const result = await getAllFeatureFlagsAndPayloads(client, {
            userId: "user-123",
         });

         expect(result.featureFlags).toEqual(response.featureFlags);
         expect(result.featureFlagPayloads).toEqual(
            response.featureFlagPayloads,
         );
      });

      it("should return empty objects when response is empty", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         spyOn(client, "getAllFlagsAndPayloads").mockResolvedValue({});

         const result = await getAllFeatureFlagsAndPayloads(client, {
            userId: "user-123",
         });

         expect(result.featureFlags).toEqual({});
         expect(result.featureFlagPayloads).toEqual({});
      });
   });

   describe("captureServerEvent", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should capture event with all properties", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const captureSpy = spyOn(client, "capture");
         const timestamp = new Date();

         captureServerEvent(client, {
            event: "purchase_completed",
            groups: { organization: "org-456" },
            properties: { amount: 99.99, currency: "USD" },
            timestamp,
            userId: "user-123",
         });

         expect(captureSpy).toHaveBeenCalledWith({
            distinctId: "user-123",
            event: "purchase_completed",
            properties: {
               $groups: { organization: "org-456" },
               amount: 99.99,
               currency: "USD",
            },
            timestamp,
         });
      });

      it("should work without optional parameters", () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const captureSpy = spyOn(client, "capture");

         captureServerEvent(client, {
            event: "page_viewed",
            userId: "user-123",
         });

         expect(captureSpy).toHaveBeenCalledWith({
            distinctId: "user-123",
            event: "page_viewed",
            properties: {},
            timestamp: undefined,
         });
      });
   });

   describe("shutdownPosthog", () => {
      const mockEnv = {
         POSTHOG_HOST: "https://us.i.posthog.com",
         POSTHOG_KEY: "phc_test_key_123",
      };

      it("should call posthog.shutdown", async () => {
         const client = getElysiaPosthogConfig(mockEnv);
         const shutdownSpy = spyOn(client, "shutdown").mockResolvedValue(
            undefined,
         );

         await shutdownPosthog(client);

         expect(shutdownSpy).toHaveBeenCalled();
      });
   });
});
