import type { SupportedLng } from "@packages/localization";
import {
   changeLanguage,
   getCurrentLanguage,
   translate,
} from "@packages/localization";
import { Combobox } from "@packages/ui/components/combobox";
import { useCallback, useMemo } from "react";

interface LanguageCommandProps {
   compact?: boolean;
}

export function LanguageCommand({ compact = false }: LanguageCommandProps) {
   const languageOptions = useMemo(
      () => [
         {
            flag: "🇧🇷",
            name: translate("common.languages.portuguese"),
            value: "pt-BR",
         },
      ],
      [],
   );

   const currentLanguage = useMemo(() => getCurrentLanguage(), []);

   const comboboxOptions = useMemo(
      () =>
         languageOptions.map((option) => ({
            label: compact ? option.flag : `${option.flag} ${option.name}`,
            value: option.value,
         })),
      [languageOptions, compact],
   );

   const handleLanguageChange = useCallback(
      async (value: string) => {
         try {
            const language = languageOptions.find(
               (option) => option.value === value,
            );
            if (language) {
               changeLanguage(language.value as SupportedLng);
               window.location.reload();
            }
         } catch (error) {
            console.error("Failed to change language:", error);
         }
      },
      [languageOptions],
   );

   return (
      <Combobox
         className="gap-2 flex items-center justify-center"
         emptyMessage={translate("dashboard.layout.language-command.empty")}
         onValueChange={handleLanguageChange}
         options={comboboxOptions}
         searchPlaceholder={translate(
            "dashboard.layout.language-command.search",
         )}
         value={currentLanguage}
      />
   );
}
