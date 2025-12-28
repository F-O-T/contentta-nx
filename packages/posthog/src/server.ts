import type { ServerEnv } from "@packages/environment/server";
import { PostHog } from "posthog-node";

export function getElysiaPosthogConfig(
   env: Pick<ServerEnv, "POSTHOG_HOST" | "POSTHOG_KEY">,
) {
   const internalPosthog = new PostHog(env.POSTHOG_KEY, {
      flushAt: 20,
      flushInterval: 10000,
      host: env.POSTHOG_HOST,
   });
   return internalPosthog;
}

export type IdentifyUserProps = {
   email?: string;
   name?: string;
   [key: string]: unknown;
};

export function identifyUser(
   posthog: PostHog,
   userId: string,
   props: IdentifyUserProps = {},
) {
   posthog.identify({
      distinctId: userId,
      properties: props,
   });
}

export type SetGroupProps = {
   slug?: string;
   name?: string;
   [key: string]: unknown;
};

export function setGroup(
   posthog: PostHog,
   organizationId: string,
   props: SetGroupProps = {},
) {
   posthog.groupIdentify({
      groupKey: organizationId,
      groupType: "organization",
      properties: props,
   });
}

export type CaptureErrorProps = {
   userId: string;
   organizationId?: string;
   errorId: string;
   path: string;
   code: string;
   message: string;
   input?: unknown;
};

export function captureError(posthog: PostHog, props: CaptureErrorProps) {
   const { userId, organizationId, errorId, path, code, message, input } =
      props;
   posthog.capture({
      distinctId: userId,
      event: "trpc_error",
      properties: {
         code,
         errorId,
         input,
         message,
         path,
         ...(organizationId
            ? { $groups: { organization: organizationId } }
            : {}),
      },
   });
}

export type FeatureFlagContext = {
   userId: string;
   userProperties?: Record<string, string>;
   groups?: Record<string, string>;
   groupProperties?: Record<string, Record<string, string>>;
};

export async function isFeatureEnabled(
   posthog: PostHog,
   flagKey: string,
   context: FeatureFlagContext,
): Promise<boolean> {
   const result = await posthog.isFeatureEnabled(flagKey, context.userId, {
      groupProperties: context.groupProperties,
      groups: context.groups,
      personProperties: context.userProperties,
   });
   return result ?? false;
}

export async function getFeatureFlag(
   posthog: PostHog,
   flagKey: string,
   context: FeatureFlagContext,
): Promise<string | boolean | undefined> {
   return posthog.getFeatureFlag(flagKey, context.userId, {
      groupProperties: context.groupProperties,
      groups: context.groups,
      personProperties: context.userProperties,
   });
}

export async function getFeatureFlagPayload(
   posthog: PostHog,
   flagKey: string,
   userId: string,
   matchValue?: string | boolean,
): Promise<unknown> {
   return posthog.getFeatureFlagPayload(flagKey, userId, matchValue);
}

export async function getAllFeatureFlags(
   posthog: PostHog,
   context: FeatureFlagContext,
): Promise<Record<string, string | boolean>> {
   return posthog.getAllFlags(context.userId, {
      groupProperties: context.groupProperties,
      groups: context.groups,
      personProperties: context.userProperties,
   });
}

export async function getAllFeatureFlagsAndPayloads(
   posthog: PostHog,
   context: FeatureFlagContext,
) {
   const result = await posthog.getAllFlagsAndPayloads(context.userId, {
      groupProperties: context.groupProperties,
      groups: context.groups,
      personProperties: context.userProperties,
   });
   return {
      featureFlagPayloads: result.featureFlagPayloads ?? {},
      featureFlags: result.featureFlags ?? {},
   };
}

export type CaptureServerEventProps = {
   userId: string;
   event: string;
   properties?: Record<string, unknown>;
   groups?: Record<string, string>;
   timestamp?: Date;
};

export function captureServerEvent(
   posthog: PostHog,
   props: CaptureServerEventProps,
) {
   const { userId, event, properties, groups, timestamp } = props;
   posthog.capture({
      distinctId: userId,
      event,
      properties: {
         ...properties,
         ...(groups ? { $groups: groups } : {}),
      },
      timestamp,
   });
}

export async function shutdownPosthog(posthog: PostHog): Promise<void> {
   await posthog.shutdown();
}
