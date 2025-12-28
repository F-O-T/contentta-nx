import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { BillingSection } from "@/pages/settings/ui/billing-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/billing")({
   component: BillingSection,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.nav.billing"),
   },
});
