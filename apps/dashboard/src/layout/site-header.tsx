import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import { SidebarTrigger } from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useCredenza } from "@/hooks/use-credenza";
import { useHaptic } from "@/hooks/use-haptic";
import { useIsStandalone } from "@/hooks/use-standalone";
import { useTRPC } from "@/integrations/clients";
import { NavUser } from "./nav-user";
import { NavigationBreadcrumb } from "./navigation-breadcrumb";
import { OrganizationSwitcherCredenza } from "./organization-switcher-credenza";

export function SiteHeader() {
   const isMobile = useIsMobile();
   const isStandalone = useIsStandalone();
   const router = useRouter();
   const location = useLocation();

   const isDev = import.meta.env.DEV;
   const showMobileNav = isMobile && (isStandalone || isDev);
   const isHomePage = location.pathname.endsWith("/home");
   const showBackButton = showMobileNav && !isHomePage;

   const trpc = useTRPC();
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const { openCredenza } = useCredenza();
   const { trigger: haptic } = useHaptic();

   const hasProSubscription =
      activeSubscription?.plan?.toLowerCase() === "pro" &&
      (activeSubscription?.status === "active" ||
         activeSubscription?.status === "trialing");

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const handleOrgSwitcherClick = () => {
      haptic("light");
      openCredenza({ children: <OrganizationSwitcherCredenza /> });
   };

   const handleBack = () => {
      haptic("light");
      router.history.back();
   };

   return (
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear ">
         <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            {!showMobileNav && (
               <>
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                     className="mx-2 data-[orientation=vertical]:h-4"
                     orientation="vertical"
                  />
               </>
            )}
            {showMobileNav && (
               <>
                  {showBackButton && (
                     <Button
                        className="-ml-1 size-9"
                        onClick={handleBack}
                        size="icon"
                        variant="ghost"
                     >
                        <ArrowLeft className="size-5" />
                     </Button>
                  )}
                  {hasProSubscription && (
                     <Button
                        className={
                           showBackButton ? "size-9 p-0" : "-ml-1 size-9 p-0"
                        }
                        onClick={handleOrgSwitcherClick}
                        size="icon"
                        variant="ghost"
                     >
                        <div className="flex size-7 items-center justify-center rounded-md border bg-primary text-primary-foreground">
                           {logo?.data ? (
                              <img
                                 alt={activeOrganization.name}
                                 className="size-5 rounded"
                                 src={logo.data}
                              />
                           ) : (
                              <span className="text-[10px] font-medium">
                                 {getInitials(activeOrganization.name)}
                              </span>
                           )}
                        </div>
                     </Button>
                  )}
                  <Separator
                     className="mx-2 data-[orientation=vertical]:h-4"
                     orientation="vertical"
                  />
               </>
            )}
            <div className="flex-1">
               <NavigationBreadcrumb />
            </div>
            <div className="ml-auto">
               <NavUser />
            </div>
         </div>
      </header>
   );
}
