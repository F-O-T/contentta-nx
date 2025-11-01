import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

export function NavMain({
   items,
}: {
   items: {
      title: string;
      url?: string;
      icon?: LucideIcon;
      subItems?: {
         url: string;
         title: string;
         icon?: LucideIcon;
      }[];
   }[];
}) {
   const { pathname } = useLocation();
   const { setOpenMobile } = useSidebar();
   const isActive = (url: string) => {
      if (!url) return false;
      return pathname === url;
   };

   return (
      <SidebarGroup>
         <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
               {items.map((item) => {
                  if (item.subItems) {
                     return (
                        <Collapsible
                           className="group/collapsible"
                           defaultOpen={isActive(item.url || "")}
                           key={item.title}
                        >
                           <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                 <SidebarMenuButton
                                    asChild
                                    className={`${isActive(item.url || "") ? "bg-primary/10 text-primary rounded-lg" : ""}`}
                                    tooltip={item.title}
                                 >
                                    <div className="flex items-center justify-between w-full">
                                       <Link
                                          className="flex items-center gap-2"
                                          onClick={() => setOpenMobile(false)}
                                          to={item.url || ""}
                                       >
                                          {item.icon && (
                                             <item.icon className="h-4 w-4" />
                                          )}
                                          <span>{item.title}</span>
                                       </Link>
                                       <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                    </div>
                                 </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                 <SidebarMenuSub>
                                    {item.subItems.map((subItem) => (
                                       <SidebarMenuSubItem key={subItem.title}>
                                          <SidebarMenuSubButton
                                             asChild
                                             className={`${isActive(subItem.url) ? "bg-primary/10 text-primary rounded-lg" : ""}`}
                                          >
                                             <Link
                                                className="flex items-center gap-2"
                                                onClick={() =>
                                                   setOpenMobile(false)
                                                }
                                                to={subItem.url}
                                             >
                                                {subItem.icon && (
                                                   <subItem.icon />
                                                )}
                                                <span>{subItem.title}</span>
                                             </Link>
                                          </SidebarMenuSubButton>
                                       </SidebarMenuSubItem>
                                    ))}
                                 </SidebarMenuSub>
                              </CollapsibleContent>
                           </SidebarMenuItem>
                        </Collapsible>
                     );
                  }

                  return (
                     <SidebarMenuItem
                        className={`${isActive(item.url || "") ? "bg-primary/10 text-primary rounded-lg" : ""}`}
                        key={item.title}
                     >
                        <SidebarMenuButton asChild tooltip={item.title}>
                           <Link
                              className="flex items-center gap-2"
                              onClick={() => setOpenMobile(false)}
                              to={item.url || ""}
                           >
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                           </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                  );
               })}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
