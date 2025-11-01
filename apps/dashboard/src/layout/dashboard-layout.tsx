import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import type * as React from "react";
import { useSubscriptionReminder } from "@/widgets/subscription/lib/use-subscription-reminder";
import type { Session } from "@/integrations/clients";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function DashboardLayout({
   children,
   session,
}: {
   children: React.ReactNode;
   session: Session | null;
}) {
   const { SubscriptionReminderComponent } = useSubscriptionReminder();

   return (
      <SidebarProvider>
         <AppSidebar session={session} variant="inset" />
         <SidebarInset>
            <SiteHeader />
            <div className="p-4 h-full flex-1 overflow-y-auto">{children}</div>
         </SidebarInset>
         <SubscriptionReminderComponent />
      </SidebarProvider>
   );
}
