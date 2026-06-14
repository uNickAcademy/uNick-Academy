// ============================================================
// Central, editable site configuration.
// Update copy, links and contact details here without
// touching component code.
// ============================================================

export const siteConfig = {
  name: "uNick Academy",
  shortName: "uNick",
  tagline: "English is about people. Not perfection.",
  description:
    "uNick Academy is a family-founded international language academy where children, teenagers, adults and companies learn to communicate through conversation, curiosity and genuine human connection.",
  url: "https://unick-academy.pl",
  email: "hello@unick-academy.pl",
  social: {
    instagram: "https://instagram.com/unickacademy",
    facebook: "https://facebook.com/unickacademy",
  },
};

// Primary navigation, shared across the whole site.
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Children", href: "/children" },
  { label: "Teenagers", href: "/teenagers" },
  { label: "Adults", href: "/adults" },
  { label: "Companies", href: "/companies" },
  { label: "How We Teach", href: "/how-we-teach" },
  { label: "Meet Us", href: "/meet-us" },
  { label: "Contact", href: "/contact" },
];

// ------------------------------------------------------------
// Links into the EXISTING platform (student panel, sign in,
// admin area, booking system, etc).
//
// These point at systems that already exist outside this
// redesign. Replace the href values below with the real,
// existing URLs/routes for the sign-in, student and admin
// areas — nothing in those systems needs to change.
// ------------------------------------------------------------
export const platformLinks = {
  studentLogin: { label: "Student Login", href: "/logowanie" },
  parentLogin: { label: "Parent Login", href: "/logowanie" },
  adminPanel: { label: "Admin Panel", href: "/admin" },
};

export const footerNav = [
  {
    heading: "Explore",
    links: primaryNav.filter((item) => item.label !== "Home"),
  },
  {
    heading: "Pathways",
    links: [
      { label: "Children", href: "/children" },
      { label: "Teenagers", href: "/teenagers" },
      { label: "Adults", href: "/adults" },
      { label: "Companies", href: "/companies" },
    ],
  },
  {
    heading: "Academy",
    links: [
      { label: "How We Teach", href: "/how-we-teach" },
      { label: "Meet Us", href: "/meet-us" },
      { label: "Contact", href: "/contact" },
      platformLinks.studentLogin,
    ],
  },
];
