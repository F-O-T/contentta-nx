import type { SupportedLng } from "@packages/localization";

import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { translate } from "@packages/localization";

export function LanguageCommand() {
   const languageOptions = [
      {
         flag: "🇺🇸",
         name: translate("common.languages.en"),
         value: "en" as SupportedLng,
      },
      {
         flag: "🇧🇷",
         name: translate("common.languages.pt"),
         value: "pt" as SupportedLng,
      },
   ] as const;

   type LanguageName = (typeof languageOptions)[number]["name"];

   const { i18n } = useTranslation();
   const [isOpen, setIsOpen] = useState(false);
   const currentLanguageRef = useRef<string | null>(null);

   const currentLanguage: SupportedLng =
      (i18n.language?.split("-")[0] as SupportedLng) || "en";

   const currentLanguageOption = languageOptions.find(
      (option) => option.value === currentLanguage,
   );

   const handleLanguageChange = async (langName: LanguageName) => {
      try {
         const language = languageOptions.find(
            (option) => option.name === langName,
         );
         if (language) {
            await i18n.changeLanguage(language.value);
            setIsOpen(false);
         }
      } catch (error) {
         console.error("Failed to change language:", error);
      }
   };

   // Set focus to current language when dialog opens
   useEffect(() => {
      if (isOpen) {
         if (currentLanguageOption) {
            currentLanguageRef.current = currentLanguageOption.name;
         }
      }
   }, [isOpen, currentLanguageOption]);

   return (
      <>
         <Button
            className="gap-2 flex items-center justify-center"
            onClick={() => setIsOpen(true)}
            variant="outline"
         >
            <span>{currentLanguageOption?.flag}</span>
            <span>{currentLanguageOption?.name || "English"}</span>
         </Button>
         <CommandDialog onOpenChange={setIsOpen} open={isOpen}>
            <CommandInput
               placeholder={translate(
                  "pages.profile.features.language-command.search",
               )}
            />
            <CommandList>
               <Command value={currentLanguageRef.current || undefined}>
                  <CommandEmpty>
                     {translate(
                        "pages.profile.features.language-command.empty",
                     )}
                  </CommandEmpty>
                  <CommandGroup>
                     {languageOptions.map((option) => (
                        <CommandItem
                           key={option.value}
                           onSelect={() => handleLanguageChange(option.name)}
                           value={option.name}
                        >
                           <span className="mr-3 text-lg">{option.flag}</span>
                           <span className="flex-1">{option.name}</span>
                           {option.value === currentLanguage && (
                              <CheckCircle className="ml-auto size-4 text-primary" />
                           )}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </Command>
            </CommandList>
         </CommandDialog>
      </>
   );
}
