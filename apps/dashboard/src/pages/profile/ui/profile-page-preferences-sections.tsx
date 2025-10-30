import { type SupportedLng, translate } from "@packages/localization";
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
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Globe, Moon } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/layout/theme-provider";
type ThemeOption = "light" | "dark" | "system";

export function PreferencesSection() {
   const { theme, setTheme } = useTheme();
   const { i18n } = useTranslation();

   const currentLanguage: SupportedLng =
      (i18n.language?.split("-")[0] as SupportedLng) || "en";

   const handleLanguageChange = async (lang: SupportedLng) => {
      try {
         await i18n.changeLanguage(lang);
      } catch (error) {
         console.error("Failed to change language:", error);
      }
   };

   const handleThemeChange = (newTheme: ThemeOption) => {
      setTheme(newTheme);
   };

   const preferenceItems = [
      {
         currentValue: theme,
         description: "Choose your preferred color theme",
         icon: Moon,
         id: "theme",
         onChange: handleThemeChange,
         options: [
            { name: "Light", value: "light" },
            { name: "Dark", value: "dark" },
            { name: "System", value: "system" },
         ],
         title: "Theme",
         type: "select",
      },
      {
         currentValue: currentLanguage,
         description: "Select your preferred language",
         icon: Globe,
         id: "language",
         onChange: handleLanguageChange,
         options: [
            { name: "English", value: "en" },
            { name: "Português", value: "pt" },
         ],
         title: "Language",
         type: "select",
      },
   ];

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
                  {preferenceItems.map((item, index) => (
                     <Fragment key={item.id}>
                        <Item>
                           <ItemMedia variant="icon">
                              <item.icon className="size-4" />
                           </ItemMedia>
                           <ItemContent>
                              <ItemTitle>{item.title}</ItemTitle>
                              <ItemDescription>
                                 {item.description}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <Select
                                 onValueChange={item.onChange}
                                 value={item.currentValue}
                              >
                                 <SelectTrigger className="w-32">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {item.options.map((option) => (
                                       <SelectItem
                                          key={option.value}
                                          value={option.value}
                                       >
                                          {option.name}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </ItemActions>
                        </Item>
                        {index !== preferenceItems.length - 1 && (
                           <ItemSeparator />
                        )}
                     </Fragment>
                  ))}
               </ItemGroup>
            </CardContent>
         </Card>
      </div>
   );
}
