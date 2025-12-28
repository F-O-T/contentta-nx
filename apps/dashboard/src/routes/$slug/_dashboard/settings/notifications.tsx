import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSection } from "@/pages/settings/ui/notifications-section";

export const Route = createFileRoute(
   "/$slug/_dashboard/settings/notifications",
)({
   component: NotificationsSection,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.nav.notifications"),
   },
});
