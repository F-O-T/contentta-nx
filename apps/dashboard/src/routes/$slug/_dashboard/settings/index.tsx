import { translate } from "@packages/localization";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SettingsMobileNav } from "@/pages/settings/ui/settings-mobile-nav";

export const Route = createFileRoute("/$slug/_dashboard/settings/")({
   component: SettingsIndexRoute,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.title"),
   },
});

function SettingsIndexRoute() {
   const isMobile = useIsMobile();
   const { slug } = Route.useParams();
   const [hasMounted, setHasMounted] = useState(false);

   useEffect(() => {
      setHasMounted(true);
   }, []);

   // Wait until client-side hydration completes to determine mobile state
   // This prevents incorrect redirects on mobile due to SSR/hydration mismatch
   if (!hasMounted) {
      return null;
   }

   // On desktop, redirect to profile section by default
   // On mobile, show the navigation list
   if (!isMobile) {
      return <Navigate params={{ slug }} to="/$slug/settings/profile" />;
   }

   return <SettingsMobileNav />;
}
