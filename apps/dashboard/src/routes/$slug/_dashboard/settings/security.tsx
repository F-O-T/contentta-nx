import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { SecuritySection } from "@/pages/settings/ui/security-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/security")({
   component: SecuritySection,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.nav.security"),
   },
});
