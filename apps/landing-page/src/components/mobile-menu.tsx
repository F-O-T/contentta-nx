import type { SupportedLng } from "@packages/localization";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const getMenuItems = (lang: SupportedLng) => {
   return [
      {
         href: "#pricing",
         name: translate("pages.landing.navigation.pricing", { lng: lang }),
      },
      {
         href: "https://docs.contentagen.com/",
         name: translate("pages.landing.navigation.docs", { lng: lang }),
      },
      {
         href: "https://blog.contentagen.com/",
         name: translate("pages.landing.navigation.blog", { lng: lang }),
      },
   ];
};

interface MobileMenuProps {
   lang?: SupportedLng;
}

export function MobileMenu({ lang = "en-US" }: MobileMenuProps) {
   const [open, setOpen] = useState(false);
   const menuItems = getMenuItems(lang);

   return (
      <div className="md:hidden">
         <Button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            size="icon"
            variant="outline"
         >
            <Menu className="size-6" />
         </Button>
         <Sheet onOpenChange={setOpen} open={open}>
            <SheetContent className="space-y-4" side="right">
               <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                     Explore our features and services
                  </SheetDescription>
               </SheetHeader>

               <ul className="space-y-4 text-base px-4">
                  {menuItems.map((item) => (
                     <li key={item.href}>
                        <a
                           className="text-muted-foreground hover:text-accent-foreground block duration-150"
                           href={item.href}
                           onClick={() => setOpen(false)}
                        >
                           <span>{item.name}</span>
                        </a>
                     </li>
                  ))}
               </ul>

               <div className="px-4 w-full mt-auto">
                  <Button className="w-full" variant="outline">
                     <a
                        href="https://app.contentagen.com/auth/sign-in"
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        Get Started
                     </a>
                  </Button>
               </div>
            </SheetContent>
         </Sheet>
      </div>
   );
}
