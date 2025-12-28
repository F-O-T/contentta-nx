import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/pages/settings/ui/settings-layout";

export const Route = createFileRoute("/$slug/_dashboard/settings")({
   component: SettingsLayoutRoute,
});

function SettingsLayoutRoute() {
   return (
      <SettingsLayout>
         <Outlet />
      </SettingsLayout>
   );
}
