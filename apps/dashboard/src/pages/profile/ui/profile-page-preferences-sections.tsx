import { translate } from "@packages/localization";

import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Moon, Globe } from "lucide-react";
import { ThemeSwitcher } from "@/layout/theme-provider";
import { LanguageCommand } from "../features/language-command";

export function PreferencesSection() {
   return (
      <div className="">
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("pages.profile.preferences.title")}
               </CardTitle>
               <CardDescription>
                  Manage your application preferences
               </CardDescription>
            </CardHeader>
            <CardContent>
               <ItemGroup>
                  {/* Theme Toggle Group */}
                  <Item>
                     <ItemMedia variant="icon">
                        <Moon className="size-4" />
                     </ItemMedia>
                     <ItemContent className="truncate">
                        <ItemTitle>Theme</ItemTitle>
                        <ItemDescription>
                           Choose your preferred color theme
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <ThemeSwitcher />
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  {/* Language Selection */}
                  <Item>
                     <ItemMedia variant="icon">
                        <Globe className="size-4" />
                     </ItemMedia>
                     <ItemContent className="truncate">
                        <ItemTitle>Language</ItemTitle>
                        <ItemDescription>
                           Select your preferred language
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <LanguageCommand />
                     </ItemActions>
                  </Item>
               </ItemGroup>
            </CardContent>
         </Card>
      </div>
   );
}
