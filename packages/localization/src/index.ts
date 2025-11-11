import i18n, { type TOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import enUSResources from "./locales/en-US";
import ptBRResources from "./locales/pt-BR";

type RecursiveKeyOf<T> = T extends object
   ? {
        [K in keyof T]: K extends string
           ? T[K] extends object
              ? `${K}.${RecursiveKeyOf<T[K]>}` | K
              : K
           : never;
     }[keyof T]
   : never;

type TranslationResources = typeof enUSResources.translation;

export type TranslationKey = RecursiveKeyOf<TranslationResources>;
export type TranslationOptions = TOptions;

const resources = {
   "en-US": enUSResources,
   "pt-BR": ptBRResources,
};

export type SupportedLng = keyof typeof resources;

declare module "i18next" {
   interface CustomTypeOptions {
      resources: typeof resources;
   }
}
const supportedLngs: SupportedLng[] = ["en-US", "pt-BR"];
i18n
   .use(Backend)
   .use(LanguageDetector)
   .init({
      defaultNS: "translation",
      fallbackLng: "en-US",
      interpolation: {
         escapeValue: false,
      },
      resources,
      supportedLngs,
   });

export default i18n;

export function changeLanguage(lang: SupportedLng) {
   return i18n.changeLanguage(lang);
}
export function translate(key: TranslationKey, options?: TOptions) {
   const result = i18n.t(key, options);
   if (result === key && !options) {
      console.warn(`Translation key not found: ${key}`);
   }
   return result;
}

// Utility to get current language for HTTP requests
export function getCurrentLanguage(): SupportedLng {
   return i18n.language as SupportedLng;
}

// Utility to get language headers for HTTP requests
export function getLanguageHeaders(): Record<string, string> {
   return {
      "Accept-Language": getCurrentLanguage(),
      "X-Locale": getCurrentLanguage(),
   };
}
