import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import type * as React from "react";
import { useSubscriptionReminder } from "@/widgets/subscription/lib/use-subscription-reminder";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const { SubscriptionReminderComponent } = useSubscriptionReminder();

   return (
      <SidebarProvider>
         <AppSidebar variant="inset" />
         <SidebarInset>
            <SiteHeader />
            <div className="p-4 h-full flex-1 overflow-y-auto">{children}</div>
         </SidebarInset>
         <SubscriptionReminderComponent />
      </SidebarProvider>
   );
}
