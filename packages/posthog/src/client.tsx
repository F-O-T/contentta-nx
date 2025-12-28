import type { ClientEnv } from "@packages/environment/client";
import { isClientProduction } from "@packages/environment/helpers";
import type { Survey } from "posthog-js";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";

type PosthogEnv = Pick<ClientEnv, "VITE_POSTHOG_HOST" | "VITE_POSTHOG_KEY">;

export function getReactPosthogConfig(env: PosthogEnv) {
   return {
      api_host: env.VITE_POSTHOG_HOST,
      api_key: env.VITE_POSTHOG_KEY,
      autocapture: true,
      capture_pageleave: true,
      capture_pageview: false,
      capture_performance: true,
   };
}
export function getAstroPosthogConfig(env: PosthogEnv) {
   return `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${env.VITE_POSTHOG_KEY}', {
api_host:'${env.VITE_POSTHOG_HOST}',
defaults: '2025-05-24'
})
`;
}

export function PostHogWrapper({
   children,
   env,
   hasConsent = true,
}: {
   children: React.ReactNode;
   env: PosthogEnv;
   hasConsent?: boolean;
}) {
   return (
      <PostHogProvider
         apiKey={env.VITE_POSTHOG_KEY}
         options={{
            ...getReactPosthogConfig(env),
            disable_session_recording: !isClientProduction,
            opt_out_capturing_by_default: !hasConsent,
         }}
      >
         {children}
      </PostHogProvider>
   );
}

export function usePosthogFeatureFlags() {
   const posthogClient = usePostHog();
   const [flags, setFlags] = useState<Record<string, boolean | string>>({});
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      const handleFlags = () => {
         const allFlags = posthogClient.featureFlags.getFlagVariants();
         setFlags(allFlags || {});
         setLoaded(true);
      };

      posthogClient.onFeatureFlags(handleFlags);

      if (posthogClient.featureFlags) {
         const existingFlags = posthogClient.featureFlags.getFlagVariants();
         if (existingFlags && Object.keys(existingFlags).length > 0) {
            setFlags(existingFlags);
            setLoaded(true);
         }
      }
   }, [posthogClient]);

   const isFeatureEnabled = (flagKey: string): boolean => {
      return Boolean(flags[flagKey]);
   };

   const getFeatureFlag = (flagKey: string): boolean | string | undefined => {
      return flags[flagKey];
   };

   return {
      flags,
      getFeatureFlag,
      isFeatureEnabled,
      loaded,
   };
}

export type CaptureClientEventProps = {
   [key: string]: unknown;
};

export function captureClientEvent(
   name: string,
   props: CaptureClientEventProps = {},
) {
   posthog.capture(name, props);
}

export function capturePageview(
   url?: string,
   properties?: Record<string, unknown>,
) {
   posthog.capture("$pageview", {
      $current_url: url ?? window.location.href,
      ...properties,
   });
}

export type PersonProperties = Record<string, unknown>;

export function setPersonProperties(properties: PersonProperties) {
   posthog.setPersonProperties(properties);
}

export function setPersonPropertiesOnce(properties: PersonProperties) {
   posthog.setPersonPropertiesForFlags(properties, false);
   posthog.capture("$set", { $set_once: properties });
}

export function identifyClient(
   userId: string,
   properties?: PersonProperties,
   propertiesOnce?: PersonProperties,
) {
   posthog.identify(userId, properties, propertiesOnce);
}

export function setClientGroup(
   groupType: string,
   groupKey: string,
   properties?: Record<string, unknown>,
) {
   posthog.group(groupType, groupKey, properties);
}

export function resetClient() {
   posthog.reset();
}

export type FeatureFlagPayload = unknown;

export function useFeatureFlag(flagKey: string) {
   const posthogClient = usePostHog();
   const [enabled, setEnabled] = useState<boolean>(false);
   const [payload, setPayload] = useState<FeatureFlagPayload>(undefined);
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      const handleFlags = () => {
         setEnabled(posthogClient.isFeatureEnabled(flagKey) ?? false);
         setPayload(posthogClient.getFeatureFlagPayload(flagKey));
         setLoaded(true);
      };

      posthogClient.onFeatureFlags(handleFlags);

      if (posthogClient.featureFlags) {
         const isEnabled = posthogClient.isFeatureEnabled(flagKey);
         if (isEnabled !== undefined) {
            setEnabled(isEnabled);
            setPayload(posthogClient.getFeatureFlagPayload(flagKey));
            setLoaded(true);
         }
      }
   }, [posthogClient, flagKey]);

   return { enabled, loaded, payload };
}

export function useFeatureFlagVariant(flagKey: string) {
   const posthogClient = usePostHog();
   const [variant, setVariant] = useState<string | boolean | undefined>(
      undefined,
   );
   const [payload, setPayload] = useState<FeatureFlagPayload>(undefined);
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      const handleFlags = () => {
         setVariant(posthogClient.getFeatureFlag(flagKey));
         setPayload(posthogClient.getFeatureFlagPayload(flagKey));
         setLoaded(true);
      };

      posthogClient.onFeatureFlags(handleFlags);

      if (posthogClient.featureFlags) {
         const flagVariant = posthogClient.getFeatureFlag(flagKey);
         if (flagVariant !== undefined) {
            setVariant(flagVariant);
            setPayload(posthogClient.getFeatureFlagPayload(flagKey));
            setLoaded(true);
         }
      }
   }, [posthogClient, flagKey]);

   return { loaded, payload, variant };
}

export function useSurveys() {
   const posthogClient = usePostHog();
   const [surveys, setSurveys] = useState<Survey[]>([]);
   const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      posthogClient.getActiveMatchingSurveys((matchingSurveys) => {
         setActiveSurveys(matchingSurveys);
      }, true);

      posthogClient.getSurveys((allSurveys) => {
         setSurveys(allSurveys);
         setLoaded(true);
      }, true);
   }, [posthogClient]);

   const captureSurveyShown = useCallback(
      (surveyId: string) => {
         posthogClient.capture("survey shown", {
            $survey_id: surveyId,
         });
      },
      [posthogClient],
   );

   const captureSurveyDismissed = useCallback(
      (surveyId: string) => {
         posthogClient.capture("survey dismissed", {
            $survey_id: surveyId,
         });
      },
      [posthogClient],
   );

   const captureSurveySent = useCallback(
      (surveyId: string, responses: Record<string, unknown>) => {
         posthogClient.capture("survey sent", {
            $survey_id: surveyId,
            ...responses,
         });
      },
      [posthogClient],
   );

   return {
      activeSurveys,
      captureSurveyDismissed,
      captureSurveySent,
      captureSurveyShown,
      loaded,
      surveys,
   };
}

export function usePageviewTracking() {
   const posthogClient = usePostHog();

   const trackPageview = useCallback(
      (url?: string, properties?: Record<string, unknown>) => {
         posthogClient.capture("$pageview", {
            $current_url: url ?? window.location.href,
            ...properties,
         });
      },
      [posthogClient],
   );

   return { trackPageview };
}

export type EarlyAccessFeature = {
   name: string;
   description: string;
   stage: "alpha" | "beta" | "concept";
   documentationUrl: string | null;
   flagKey: string | null;
};

export function useEarlyAccessFeatures() {
   const posthogClient = usePostHog();
   const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
   const [loaded, setLoaded] = useState(false);
   const [enrolledFeatures, setEnrolledFeatures] = useState<Set<string>>(
      new Set(),
   );

   const loadFeatures = useCallback(() => {
      console.log("[DEBUG] Loading early access features...");
      posthogClient.getEarlyAccessFeatures((earlyAccessFeatures) => {
         console.log(
            "[DEBUG] Early access features loaded:",
            earlyAccessFeatures,
         );
         setFeatures(earlyAccessFeatures);
         setLoaded(true);

         const enrolled = new Set<string>();
         for (const feature of earlyAccessFeatures) {
            if (feature.flagKey) {
               const isEnabled = posthogClient.isFeatureEnabled(
                  feature.flagKey,
               );
               console.log(
                  `[DEBUG] Feature ${feature.flagKey} enabled:`,
                  isEnabled,
               );
               if (isEnabled) {
                  enrolled.add(feature.flagKey);
               }
            }
         }
         console.log("[DEBUG] Enrolled features:", Array.from(enrolled));
         setEnrolledFeatures(enrolled);
      }, true);
   }, [posthogClient]);

   useEffect(() => {
      loadFeatures();
   }, [loadFeatures]);

   const updateEnrollment = useCallback(
      (flagKey: string, isEnrolled: boolean) => {
         posthogClient.updateEarlyAccessFeatureEnrollment(flagKey, isEnrolled);

         setEnrolledFeatures((prev) => {
            const next = new Set(prev);
            if (isEnrolled) {
               next.add(flagKey);
            } else {
               next.delete(flagKey);
            }
            return next;
         });

         posthogClient.reloadFeatureFlags();
      },
      [posthogClient],
   );

   const isEnrolled = useCallback(
      (flagKey: string) => {
         return enrolledFeatures.has(flagKey);
      },
      [enrolledFeatures],
   );

   return {
      enrolledFeatures,
      features,
      isEnrolled,
      loaded,
      reloadFeatures: loadFeatures,
      updateEnrollment,
   };
}

type RouterLocation = {
   href: string;
   pathname: string;
   search: string | Record<string, unknown>;
};

export function usePosthogRouterTracking(location: RouterLocation) {
   const posthogClient = usePostHog();
   const [previousPath, setPreviousPath] = useState<string | null>(null);

   useEffect(() => {
      if (previousPath !== location.pathname) {
         const searchString =
            typeof location.search === "string"
               ? location.search
               : JSON.stringify(location.search);
         posthogClient.capture("$pageview", {
            $current_url: location.href,
            $pathname: location.pathname,
            $referrer: previousPath
               ? `${window.location.origin}${previousPath}`
               : document.referrer,
            $search: searchString,
         });
         setPreviousPath(location.pathname);
      }
   }, [
      posthogClient,
      location.href,
      location.pathname,
      location.search,
      previousPath,
   ]);
}

export function PosthogRouterTracker({
   location,
}: {
   location: RouterLocation;
}) {
   usePosthogRouterTracking(location);
   return null;
}

export { usePostHog };
