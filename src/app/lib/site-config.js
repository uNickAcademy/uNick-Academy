// ============================================================
// Central, editable site configuration.
// Locale-independent facts live here. Translated copy lives in
// app/lib/dictionaries/{en,pl}.js.
// ============================================================

export const siteConfig = {
  name: "uNick Academy",
  shortName: "uNick",
  alternateName: "uNick Academy — szkoła języka angielskiego",
  url: "https://unick-academy.pl",
  email: "hello@unick-academy.pl",
  // Aktualny numer telefonu szkoły. Wartość E.164 dla linków `tel:` oraz
  // JSON-LD, `display` do renderowania w treści.
  phone: {
    e164: "+48666661750",
    display: "+48 666 661 750",
  },
  social: {
    instagram: "https://instagram.com/unickacademy",
    facebook: "https://facebook.com/unickacademy",
    youtube: "https://youtube.com/@unickacademy",
    linkedin: "https://www.linkedin.com/company/unick-academy/",
  },
  // Adres siedziby (zajęcia stacjonarne). Renderowany jako tekst dostępny dla
  // wyszukiwarek (patrz komponent AddressBlock) oraz w JSON-LD PostalAddress.
  address: {
    streetAddress: "Nowa 23",
    village: "Rumianek",
    postalCode: "62-080",
    // Rumianek należy do poczty i gminy Tarnowo Podgórne (powiat poznański).
    addressLocality: "Tarnowo Podgórne",
    municipality: "gmina Tarnowo Podgórne",
    addressRegion: "wielkopolskie",
    addressCountry: "PL",
  },
  // Link do Google Maps / trasy dojazdu. Zbudowany z pełnego adresu tekstowego,
  // by nie zależeć od nieznanego Place ID ani zgadywanych współrzędnych.
  mapsQuery: "uNick Academy, Nowa 23, Rumianek, 62-080 Tarnowo Podgórne",
  // Miejscowości, z których dojeżdżają uczniowie (obszar obsługi). Używane w
  // treści lokalnej oraz w JSON-LD areaServed.
  areaServed: [
    "Rumianek",
    "Tarnowo Podgórne",
    "Lusówko",
    "Lusowo",
    "Sady",
    "Swadzim",
    "Baranowo",
    "Przeźmierowo",
    "Jankowice",
    "Ceradz Kościelny",
    "Poznań",
    "powiat poznański",
  ],
  // Measurement ID nie jest sekretem (widoczny w kliencie każdej strony z GA),
  // więc trzymamy go tu jak resztę publicznej konfiguracji.
  googleAnalyticsId: "G-RZZD2NLW6F",
};

export const foundationConfig = {
  name: "uNick Academy Foundation", legalName: "UNICK ACADEMY FOUNDATION", legalForm: "Fundacja",
  registrationDate: "18 grudnia 2025 r.", krs: "0001212961", nip: "7812102071", regon: "543545058",
  address: { streetAddress: "Nowa 23", village: "Rumianek", postalCode: "62-080", addressLocality: "Tarnowo Podgórne", addressCountry: "Polska" },
};

// Pełny adres w jednej linii — do linków map i podpisów.
export function fullAddressLine() {
  const a = siteConfig.address;
  return `${a.streetAddress}, ${a.village}, ${a.postalCode} ${a.addressLocality}`;
}

// Bezpieczny link do Google Maps (wyszukiwanie po adresie tekstowym).
export function mapsSearchUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.mapsQuery)}`;
}

// Link „Wyznacz trasę” (Google Maps directions).
export function mapsDirectionsUrl() {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(siteConfig.mapsQuery)}`;
}

// ------------------------------------------------------------
// Links into the EXISTING platform (student panel, sign in,
// admin area, booking system, etc).
//
// These point at systems that already exist outside this
// redesign and outside the [locale] routing — do not prefix
// them with a locale. Labels are translated via
// dict.common.platformLinks.
// ------------------------------------------------------------
// Linki do realnych tras zintegrowanej platformy (panel ucznia/nauczyciela/
// admina to aplikacja TS pod /login, /zapisy itd. — bez prefiksu locale).
export const platformLinks = {
  studentLogin: { href: "/login" },
  parentLogin: { href: "/login" },
  adminPanel: { href: "/admin/dashboard" },
  login: { href: "/login" },
  signup: { href: "/zapisy" },
};

const NAV_ROUTES = [
  { key: "home", path: "" },
  {
    key: "isItForMe",
    children: [
      { key: "children", path: "/children" },
      { key: "teenagers", path: "/teenagers" },
      { key: "adults", path: "/adults" },
      { key: "companies", path: "/companies" },
    ],
  },
  { key: "howWeTeach", path: "/how-we-teach" },
  { key: "meetUs", children: [
    { key: "meetAcademy", path: "/meet-us" },
    { key: "foundation", path: "/foundation", locales: ["pl"] },
  ] },
  { key: "contact", path: "/contact" },
  { key: "teachersZone", path: "/teachers-zone" },
];

export function getPrimaryNav(locale, dict) {
  return NAV_ROUTES.map((item) => {
    if (item.children) {
      return {
        label: dict.common.nav[item.key],
        children: item.children
          .filter((child) => !child.locales || child.locales.includes(locale))
          .map((child) => ({ label: dict.common.nav[child.key], href: `/${locale}${child.path}` })),
      };
    }
    return {
      label: dict.common.nav[item.key],
      href: `/${locale}${item.path}`,
    };
  });
}

export function getFooterNav(locale, dict) {
  const primary = getPrimaryNav(locale, dict);
  const homeHref = `/${locale}`;

  return [
    {
      heading: dict.common.footer.explore,
      links: primary
        .flatMap((item) => (item.children ? item.children : [item]))
        .filter((item) => item.href !== homeHref),
    },
    {
      heading: dict.common.footer.pathways,
      links: [
        { label: dict.common.nav.children, href: `/${locale}/children` },
        { label: dict.common.nav.teenagers, href: `/${locale}/teenagers` },
        { label: dict.common.nav.adults, href: `/${locale}/adults` },
        { label: dict.common.nav.companies, href: `/${locale}/companies` },
      ],
    },
    {
      heading: dict.common.footer.academy,
      links: [
        { label: dict.common.nav.howWeTeach, href: `/${locale}/how-we-teach` },
        { label: dict.common.nav.meetUs, href: `/${locale}/meet-us` },
        {
          label: dict.common.nav.localSchool,
          href:
            locale === "en"
              ? `/en/english-school-tarnowo-podgorne`
              : `/pl/szkola-jezykowa-tarnowo-podgorne`,
        },
        { label: dict.common.nav.contact, href: `/${locale}/contact` },
        { label: dict.common.nav.teachersZone, href: `/${locale}/teachers-zone` },
        { label: dict.common.platformLinks.studentLogin, href: platformLinks.studentLogin.href },
      ],
    },
  ];
}
