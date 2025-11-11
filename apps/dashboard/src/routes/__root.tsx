import brandConfig from "@packages/brand/index.json";
import { PostHogWrapper } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import appCss from "@packages/ui/globals.css?url";
import { useMutation } from "@tanstack/react-query";
import {
   createRootRouteWithContext,
   HeadContent,
   Outlet,
   redirect,
   Scripts,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { ErrorModalProvider } from "@/features/error-modal/lib/error-modal-context";
import { ErrorModal } from "@/features/error-modal/ui/error-modal";
import { useTRPC } from "@/integrations/clients";
import { ThemeProvider } from "@/layout/theme-provider";
import type { RouterContext } from "../router";
import "@packages/localization";
import i18n, { getCurrentLanguage } from "@packages/localization";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { NotFoundComponent } from "@/default/not-found";

export const Route = createRootRouteWithContext<RouterContext>()({
   component: RootComponent,

   head: () => ({
      links: [
         {
            href: appCss,
            rel: "stylesheet",
         },
         { href: "/favicon.svg", rel: "icon" },
      ],
      meta: [
         {
            title: `${brandConfig.name} - ${brandConfig.catch}`,
         },
         {
            charSet: "UTF-8",
         },
         {
            content: "width=device-width, initial-scale=1.0",
            name: "viewport",
         },
         {
            content: getCurrentLanguage(),
            name: "language",
         },
      ],
      scripts: [
         ...(!import.meta.env.PROD
            ? [
                 {
                    children: `import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true`,
                    type: "module",
                 },
                 {
                    src: "/@vite/client",
                    type: "module",
                 },
              ]
            : []),
         {
            src: import.meta.env.PROD
               ? "/assets/entry-client.js"
               : "/src/entry-client.tsx",
            type: "module",
         },
      ],
   }),
   loader: async ({ location }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   notFoundComponent: () => (
      <div className="h-screen w-screen">
         <NotFoundComponent />
      </div>
   ),
   ssr: true,
   wrapInSuspense: true,
});

function RootComponent() {
   return (
      <html lang={getCurrentLanguage()}>
         <head>
            <HeadContent />
         </head>
         <body>
            <I18nextProvider defaultNS={"translation"} i18n={i18n}>
               <PostHogWrapper>
                  <ThemeProvider
                     attribute="class"
                     defaultTheme="system"
                     enableSystem
                  >
                     <ErrorModalProvider>
                        <ErrorModalWithMutation />
                        <Toaster />
                        <Outlet />
                        <TanStackRouterDevtools position="bottom-left" />{" "}
                        {/* Start rendering router matches */}
                     </ErrorModalProvider>
                  </ThemeProvider>
               </PostHogWrapper>
            </I18nextProvider>
            <Scripts />
         </body>
      </html>
   );
}

function ErrorModalWithMutation() {
   const trpc = useTRPC();
   const submitBugReport = useMutation(
      trpc.bugReport.submitBugReport.mutationOptions(),
   );

   return <ErrorModal submitBugReport={submitBugReport} />;
}
