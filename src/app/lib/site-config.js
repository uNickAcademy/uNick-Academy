// ============================================================
// Central, editable site configuration.
// Locale-independent facts live here. Translated copy lives in
// app/lib/dictionaries/{en,pl}.js.
// ============================================================

export const siteConfig = {
  name: "uNick Academy",
  shortName: "uNick",
  url: "https://unick-academy.pl",
  email: "hello@unick-academy.pl",
  social: {
    instagram: "https://instagram.com/unickacademy",
    facebook: "https://facebook.com/unickacademy",
  },
};

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
  { key: "meetUs", path: "/meet-us" },
  { key: "contact", path: "/contact" },
  // teachersZone (sklep z konspektami) wróci w Fazie 4 — wymaga wpięcia Supabase.
];

export function getPrimaryNav(locale, dict) {
  return NAV_ROUTES.map((item) => {
    if (item.children) {
      return {
        label: dict.common.nav[item.key],
        children: item.children.map((child) => ({
          label: dict.common.nav[child.key],
          href: `/${locale}${child.path}`,
        })),
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
        { label: dict.common.nav.contact, href: `/${locale}/contact` },
        { label: dict.common.platformLinks.studentLogin, href: platformLinks.studentLogin.href },
      ],
    },
  ];
}
