// ============================================================
// Reużywalne helpery SEO dla stron marketingowych ([locale]).
// Budują spójne metadane Next.js: kanoniczny URL wskazujący na
// samą stronę w danym języku, wzajemne hreflang (pl / en / x-default)
// oraz Open Graph / Twitter Cards.
// ============================================================
import { siteConfig } from "./site-config";

const OG_IMAGE = "/brand/logo-horizontal.jpeg";

// x-default kierujemy na wersję polską — to język podstawowy marki,
// a `/` przekierowuje na `/pl`.
const XDEFAULT_LOCALE = "pl";

/**
 * Zbuduj obiekt Metadata dla strony pod /[locale]/<path>.
 *
 * @param {object} args
 * @param {string} args.locale        aktualny język ("pl" | "en")
 * @param {string} [args.path]        ścieżka po segmencie locale, np. "/contact" ("" dla strony głównej)
 * @param {string} args.title         tytuł strony (bez sufiksu marki — szablon dokłada go w layoutcie)
 * @param {string} args.description   meta description
 * @param {string} [args.ogImage]     opcjonalny obraz OG (ścieżka względna)
 */
export function buildMetadata({ locale, path = "", title, description, ogImage = OG_IMAGE, availableLocales = ["pl", "en"] }) {
  const canonicalPath = `/${locale}${path}`;
  const languages = Object.fromEntries([
    ...availableLocales.map((availableLocale) => [availableLocale, `/${availableLocale}${path}`]),
    ["x-default", `/${availableLocales.includes(XDEFAULT_LOCALE) ? XDEFAULT_LOCALE : availableLocales[0]}${path}`],
  ]);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}${canonicalPath}`,
      siteName: siteConfig.name,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage],
    },
  };
}
