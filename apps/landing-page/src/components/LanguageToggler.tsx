import type { SupportedLng } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@packages/ui/components/dialog";
import { cn } from "@packages/ui/lib/utils";
import { Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { getLocalizedPath } from "../i18n/utils";

interface LanguageTogglerProps {
   currentLang: SupportedLng;
   currentPath?: string;
}

export function LanguageToggler({
   currentLang,
   currentPath = "/",
}: LanguageTogglerProps) {
   const [open, setOpen] = useState(false);

   const languageOptions = useMemo(
      () => [
         { code: "en-US" as const, flag: "🇺🇸", name: "English" },
         { code: "pt-BR" as const, flag: "🇧🇷", name: "Português" },
      ],
      [],
   );

   const currentLanguageDisplay = useMemo(() => {
      return (
         languageOptions.find((lang) => lang.code === currentLang)?.name ||
         "English"
      );
   }, [currentLang, languageOptions]);

   const handleLanguageChange = (lang: SupportedLng) => {
      if (currentLang === lang) {
         setOpen(false);
         return;
      }

      // Navega para a versão traduzida da página
      const newPath = getLocalizedPath(currentPath, lang);
      window.location.href = newPath;
   };

   return (
      <Dialog onOpenChange={setOpen} open={open}>
         <DialogTrigger asChild>
            <Button
               className="flex items-center gap-2"
               size="sm"
               variant="outline"
            >
               <Globe className="w-4 h-4" />
               <span className="hidden sm:inline">
                  {currentLanguageDisplay}
               </span>
            </Button>
         </DialogTrigger>
         <DialogContent className="rounded-lg md:max-w-sm">
            <DialogHeader>
               <DialogTitle>Language</DialogTitle>
               <DialogDescription>
                  Select your preferred language
               </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
               {languageOptions.map((lang) => (
                  <Button
                     className={cn(
                        "w-full justify-start text-left font-normal",
                        currentLang === lang.code &&
                           "bg-primary text-primary-foreground",
                     )}
                     key={lang.code}
                     onClick={() => handleLanguageChange(lang.code)}
                     variant={currentLang === lang.code ? "default" : "outline"}
                  >
                     <span className="mr-2">{lang.flag}</span>
                     <span>{lang.name}</span>
                     {currentLang === lang.code && (
                        <span className="ml-auto font-semibold">✓</span>
                     )}
                  </Button>
               ))}
            </div>
         </DialogContent>
      </Dialog>
   );
}
