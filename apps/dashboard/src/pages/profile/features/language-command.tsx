import type { SupportedLng } from "@packages/localization";
import {
   changeLanguage,
   getCurrentLanguage,
   translate,
} from "@packages/localization";
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
import { useCallback, useMemo, useState } from "react";

export function LanguageCommand() {
   type LanguageOptions = {
      flag: string;
      name: string;
      value: SupportedLng;
   };

   const languageOptions = useMemo(
      (): LanguageOptions[] => [
         {
            flag: "🇺🇸",
            name: translate("common.languages.en"),
            value: "en-US",
         },
         {
            flag: "🇧🇷",
            name: translate("common.languages.pt"),
            value: "pt-BR",
         },
      ],
      [],
   );

   type LanguageName = (typeof languageOptions)[number]["name"];
   const currentLanguage = useMemo(() => getCurrentLanguage(), []);

   const [isOpen, setIsOpen] = useState(false);

   const currentLanguageOption = languageOptions.find(
      (option) => option.value === currentLanguage,
   );

   const handleLanguageChange = useCallback(
      async (langName: LanguageName) => {
         try {
            const language = languageOptions.find(
               (option) => option.name === langName,
            );
            if (language) {
               changeLanguage(language.value);
               setIsOpen(false);
               window.location.reload();
            }
         } catch (error) {
            console.error("Failed to change language:", error);
         }
      },
      [languageOptions],
   );

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
               <Command>
                  <CommandEmpty>
                     {translate(
                        "pages.profile.features.language-command.empty",
                     )}
                  </CommandEmpty>
                  <CommandGroup>
                     {languageOptions.map((option) => (
                        <CommandItem
                           className="flex items-center justify-start gap-2"
                           key={option.value}
                           onSelect={() => handleLanguageChange(option.name)}
                           value={`${option.flag} ${option.name}`}
                        >
                           <span>{option.flag}</span>
                           <span>{option.name}</span>
                           {option.value === currentLanguage && (
                              <CheckCircle className="size-4 text-primary" />
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
