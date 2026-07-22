// ============================================================
// Generatory JSON-LD (schema.org) dla uNick Academy.
//
// Wszystkie encje łączymy przez spójne identyfikatory `@id`, tak by
// wyszukiwarki widziały JEDNĄ organizację, jedną stronę WWW i jedną
// lokalizację. Nie zgadujemy współrzędnych geo ani godzin otwarcia —
// dodamy je, gdy właściciel poda potwierdzone dane.
// ============================================================
import { siteConfig, fullAddressLine } from "./site-config";

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const PLACE_ID = `${siteConfig.url}/#place`;

function postalAddress() {
  const a = siteConfig.address;
  return {
    "@type": "PostalAddress",
    streetAddress: a.streetAddress,
    addressLocality: a.addressLocality,
    postalCode: a.postalCode,
    addressRegion: a.addressRegion,
    addressCountry: a.addressCountry,
  };
}

// Główna encja organizacji — jednocześnie EducationalOrganization i
// LocalBusiness (zajęcia stacjonarne). Reużywana jako `publisher`/`provider`.
export function organizationNode() {
  return {
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": ORG_ID,
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone.e164,
    taxID: "7812067015",
    vatID: "PL7812067015",
    image: `${siteConfig.url}/brand/logo-horizontal.jpeg`,
    logo: `${siteConfig.url}/brand/shield.png`,
    description:
      "Międzynarodowa szkoła języka angielskiego w Rumianku (gmina Tarnowo Podgórne). Zajęcia dla dzieci, młodzieży, dorosłych i firm — stacjonarnie i online, z native speakerami i międzynarodowymi lektorami.",
    address: postalAddress(),
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    availableLanguage: ["pl", "en"],
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.youtube,
      siteConfig.social.linkedin,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.phone.e164,
      email: siteConfig.email,
      contactType: "customer service",
      areaServed: "PL",
      availableLanguage: ["pl", "en"],
    },
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    inLanguage: ["pl", "en"],
    publisher: { "@id": ORG_ID },
  };
}

// Fizyczna lokalizacja szkoły (dla wyników lokalnych / map).
function placeNode() {
  return {
    "@type": "Place",
    "@id": PLACE_ID,
    name: `${siteConfig.name} — ${siteConfig.address.village}`,
    address: postalAddress(),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.mapsQuery)}`,
  };
}

// Globalny graf dołączany w layoutcie [locale] — organizacja + strona WWW +
// lokalizacja. To kanoniczna definicja encji uNick Academy.
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode(), placeNode()],
  };
}

// Okruszki (breadcrumbs) dla podstrony.
export function breadcrumbNode(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

// FAQPage — TYLKO gdy pytania i odpowiedzi są realnie widoczne na stronie.
export function faqNode(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

// Kurs oferowany przez szkołę (używać tylko na stronach opisujących program).
export function courseNode({ name, description, path, courseMode }) {
  return {
    "@type": "Course",
    name,
    description,
    url: `${siteConfig.url}${path}`,
    inLanguage: "pl",
    provider: { "@id": ORG_ID },
    ...(courseMode ? { courseMode } : {}),
  };
}

// WebPage dla konkretnej podstrony (spina treść z organizacją i lokalizacją).
export function webPageNode({ name, description, path, locale }) {
  return {
    "@type": "WebPage",
    "@id": `${siteConfig.url}/${locale}${path}#webpage`,
    url: `${siteConfig.url}/${locale}${path}`,
    name,
    description,
    inLanguage: locale === "pl" ? "pl-PL" : "en-GB",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    ...(path.includes("tarnowo-podgorne") ? { mainEntityOfPage: { "@id": PLACE_ID } } : {}),
  };
}

export const ENTITY_IDS = { ORG_ID, WEBSITE_ID, PLACE_ID };

// Pomocniczo: pełny adres w jednej linii (reużycie przez UI).
export { fullAddressLine };
