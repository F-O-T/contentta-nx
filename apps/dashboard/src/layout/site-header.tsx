import { Separator } from "@packages/ui/components/separator";
import { SidebarTrigger } from "@packages/ui/components/sidebar";
import { NavUser } from "./nav-user";
export function SiteHeader() {
   return (
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear ">
         <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
               className="mx-2 data-[orientation=vertical]:h-4"
               orientation="vertical"
            />
            <div className="ml-auto">
               <NavUser />
            </div>
         </div>
      </header>
   );
}
