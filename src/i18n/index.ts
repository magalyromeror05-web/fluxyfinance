import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import es from "./locales/es.json";
import en from "./locales/en.json";

export const supportedLanguages = ["pt-BR", "es", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageOptions: Array<{ code: SupportedLanguage; flag: string; label: string }> = [
  { code: "pt-BR", flag: "🇧🇷", label: "PT" },
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

const initialLng = normalizeLanguage(
  typeof localStorage !== "undefined" ? localStorage.getItem("fluxy-language") : "pt-BR",
);

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: "pt-BR",
  defaultNS: "translation",
  ns: ["translation"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

if (typeof localStorage !== "undefined") {
  localStorage.setItem("fluxy-language", initialLng);
}

export default i18n;
