import en from "./en";
import pl from "./pl";

export const locales = ["en", "pl"];
export const defaultLocale = "en";

const dictionaries = { en, pl };

// Synchronous on purpose — client components (e.g. Navbar, the
// consultation modal) need to read translations without awaiting.
export function getDictionary(locale) {
  return dictionaries[locale] || dictionaries[defaultLocale];
}
