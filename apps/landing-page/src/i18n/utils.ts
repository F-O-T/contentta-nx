import type { SupportedLng } from "@packages/localization";
import enUS from "@packages/localization/locales/en-US";
import ptBR from "@packages/localization/locales/pt-BR";
import { defaultLang, supportedLanguages } from "./config";

const translations = {
   "en-US": enUS.translation,
   "pt-BR": ptBR.translation,
};

export function getLangFromUrl(url: URL): SupportedLng {
   const [, lang] = url.pathname.split("/");
   if (supportedLanguages.includes(lang as SupportedLng)) {
      return lang as SupportedLng;
   }
   return defaultLang;
}

export function useTranslations(lang: SupportedLng) {
   return function t(
      key: string,
      replacements?: Record<string, string>,
   ): string {
      const firstDotIndex = key.indexOf(".");
      if (firstDotIndex === -1) {
         return key;
      }

      const parts = key.split(".");
      let value: any = translations[lang];

      if (parts.length >= 2) {
         const potentialNamespace = `${parts[0]}.${parts[1]}`;
         if (potentialNamespace in value) {
            value = value[potentialNamespace];
            for (let i = 2; i < parts.length; i++) {
               const k = parts[i];
               if (k && value && typeof value === "object" && k in value) {
                  value = value[k];
               } else {
                  return key;
               }
            }
         } else {
            return key;
         }
      }

      if (typeof value !== "string") {
         return key;
      }

      if (replacements) {
         return Object.entries(replacements).reduce(
            (str, [placeholder, replacement]) =>
               str.replace(new RegExp(`{{${placeholder}}}`, "g"), replacement),
            value,
         );
      }

      return value;
   };
}

export function getLocalizedPath(path: string, lang: SupportedLng): string {
   if (lang === defaultLang) {
      return path === "/" ? "/" : path;
   }
   return `/${lang}${path === "/" ? "" : path}`;
}

export function removeLocalePath(pathname: string): string {
   const [, lang, ...rest] = pathname.split("/");
   if (supportedLanguages.includes(lang as SupportedLng)) {
      return `/${rest.join("/")}`;
   }
   return pathname;
}
