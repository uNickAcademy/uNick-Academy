import LocalLanding from "../../components/LocalLanding";
import { getDictionary } from "../../lib/dictionaries";
import { siteConfig } from "../../lib/site-config";

const PL_PATH = "/szkola-jezykowa-tarnowo-podgorne";
const EN_PATH = "/english-school-tarnowo-podgorne";

// Local landing page — English slug. The Polish counterpart uses a different
// slug, so hreflang is built manually (pl → PL slug, en → EN slug).
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.localTarnowo;
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}${EN_PATH}`,
      languages: {
        pl: `/pl${PL_PATH}`,
        en: `/en${EN_PATH}`,
        "x-default": `/pl${PL_PATH}`,
      },
    },
    openGraph: {
      title: `${t.meta.title} | ${siteConfig.name}`,
      description: t.meta.description,
      url: `${siteConfig.url}/${locale}${EN_PATH}`,
      siteName: siteConfig.name,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      type: "website",
      images: [{ url: "/brand/logo-horizontal.jpeg" }],
    },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  return <LocalLanding locale={locale} path={EN_PATH} />;
}
