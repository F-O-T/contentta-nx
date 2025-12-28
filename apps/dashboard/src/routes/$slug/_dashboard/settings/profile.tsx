import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { ProfileSection } from "@/pages/settings/ui/profile-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/profile")({
   component: ProfileSection,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.nav.profile"),
   },
});
