import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { EncryptionSection } from "@/pages/settings/ui/encryption-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/encryption")({
   component: EncryptionSection,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.nav.encryption"),
   },
});
