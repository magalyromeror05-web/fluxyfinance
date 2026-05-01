import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import es from "./locales/es.json";
import en from "./locales/en.json";

export const supportedLanguages = ["pt-BR", "es", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageOptions: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
  { code: "pt-BR", flag: "🇧🇷", label: "PT-BR" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇺🇸", label: "EN" },
];

const normalizeLanguage = (language?: string | null): SupportedLanguage => {
  if (!language) return "pt-BR";
  const lower = language.toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return "pt-BR";
};

export const getSupportedLanguage = normalizeLanguage;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: "pt-BR",
    defaultNS: "translation",
    ns: ["translation"],
    supportedLngs: [...supportedLanguages],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      convertDetectedLanguage: normalizeLanguage,
    },
  });

export default i18n;
