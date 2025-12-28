import { createFileRoute } from "@tanstack/react-router";
import { ApiKeyPage } from "@/pages/api-keys/ui/api-key-page";

export const Route = createFileRoute("/$slug/_dashboard/settings/api-keys")({
   component: ApiKeyPage,
   staticData: {
      breadcrumb: "API Keys",
   },
});
