import {
   Breadcrumb,
   BreadcrumbItem,
   BreadcrumbLink,
   BreadcrumbList,
   BreadcrumbPage,
   BreadcrumbSeparator,
} from "@packages/ui/components/breadcrumb";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Link, useMatches, useParams } from "@tanstack/react-router";
import { Home } from "lucide-react";

type TBreadcrumbItem = {
   to: string;
   params: Record<string, string>;
   isHome: boolean;
   label: string;
};

export function NavigationBreadcrumb() {
   const matches = useMatches();
   const { slug } = useParams({ from: "/$slug" });

   const contentBreadcrumbs: TBreadcrumbItem[] = matches
      .filter((match) => {
         const isLayoutRoute =
            match.pathname === "/" ||
            match.id === "/_dashboard" ||
            match.id === "/$slug";

         return match.staticData?.breadcrumb !== undefined && !isLayoutRoute;
      })
      .map((match) => ({
         isHome: false,
         label: match.staticData.breadcrumb as string,
         params: match.params as Record<string, string>,
         to: match.pathname,
      }));

   const isHomeBreadcrumbPage = contentBreadcrumbs.some(
      (breadcrumb) =>
         breadcrumb.label === "Home" || breadcrumb.to === `/${slug}/home`,
   );

   let allBreadcrumbs: TBreadcrumbItem[] = [
      {
         isHome: true,
         label: "Home",
         params: { slug },
         to: "/$slug/home",
      },
   ];

   if (!isHomeBreadcrumbPage) {
      allBreadcrumbs = [...allBreadcrumbs, ...contentBreadcrumbs];
   }

   // On home page, show only the home icon (not clickable)
   const isOnHomePage =
      allBreadcrumbs.length === 1 && allBreadcrumbs[0]?.isHome;

   if (isOnHomePage) {
      return (
         <Breadcrumb>
            <BreadcrumbList>
               <BreadcrumbItem>
                  <BreadcrumbPage className={cn("flex items-center")}>
                     <Home className={cn("size-4")} />
                  </BreadcrumbPage>
               </BreadcrumbItem>
            </BreadcrumbList>
         </Breadcrumb>
      );
   }

   return (
      <TooltipProvider>
         <Breadcrumb>
            <BreadcrumbList>
               {allBreadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === allBreadcrumbs.length - 1;

                  return (
                     <>
                        {index > 0 && (
                           <BreadcrumbSeparator key={`sep-${index + 1}`} />
                        )}

                        <BreadcrumbItem key={breadcrumb.to}>
                           {isLast ? (
                              <BreadcrumbPage className={cn("font-medium")}>
                                 {breadcrumb.isHome ? (
                                    <Home className={cn("size-4")} />
                                 ) : (
                                    breadcrumb.label
                                 )}
                              </BreadcrumbPage>
                           ) : (
                              <BreadcrumbLink asChild>
                                 <Link
                                    className="hover:text-foreground"
                                    onClick={(e: React.MouseEvent) => {
                                       if (
                                          window.location.pathname ===
                                          breadcrumb.to
                                       ) {
                                          e.preventDefault();
                                       }
                                    }}
                                    params={breadcrumb.params}
                                    to={breadcrumb.to}
                                 >
                                    {breadcrumb.isHome ? (
                                       <Tooltip>
                                          <TooltipTrigger asChild>
                                             <Home className={cn("size-4")} />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                             <p>Go back to home page</p>
                                          </TooltipContent>
                                       </Tooltip>
                                    ) : (
                                       breadcrumb.label
                                    )}
                                 </Link>
                              </BreadcrumbLink>
                           )}
                        </BreadcrumbItem>
                     </>
                  );
               })}
            </BreadcrumbList>
         </Breadcrumb>
      </TooltipProvider>
   );
}
