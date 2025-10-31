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
import { Globe, Moon } from "lucide-react";
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
                  {translate("pages.profile.preferences.description")}
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
                        <ItemTitle>
                           {translate(
                              "pages.profile.preferences.items.theme.title",
                           )}
                        </ItemTitle>
                        <ItemDescription>
                           {translate(
                              "pages.profile.preferences.items.theme.description",
                           )}
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
                        <ItemTitle>
                           {translate(
                              "pages.profile.preferences.items.language.title",
                           )}
                        </ItemTitle>
                        <ItemDescription>
                           {translate(
                              "pages.profile.preferences.items.language.description",
                           )}
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
