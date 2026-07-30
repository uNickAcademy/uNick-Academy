import LocalLanding from "../../components/LocalLanding";
import { getDictionary } from "../../lib/dictionaries";
import { siteConfig } from "../../lib/site-config";

const PL_PATH = "/szkola-jezykowa-tarnowo-podgorne";
const EN_PATH = "/english-school-tarnowo-podgorne";

// Lokalna strona docelowa — polski slug. Angielski odpowiednik ma inny slug,
// dlatego hreflang budujemy ręcznie (pl → slug PL, en → slug EN).
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.localTarnowo;
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}${PL_PATH}`,
      languages: {
        pl: `/pl${PL_PATH}`,
        en: `/en${EN_PATH}`,
        "x-default": `/pl${PL_PATH}`,
      },
    },
    openGraph: {
      title: `${t.meta.title} | ${siteConfig.name}`,
      description: t.meta.description,
      url: `${siteConfig.url}/${locale}${PL_PATH}`,
      siteName: siteConfig.name,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      type: "website",
      images: [{ url: "/brand/logo-horizontal.jpeg" }],
    },
  };
}

export default async function Page({ params }) {
  const { locale } = await params;
  return <LocalLanding locale={locale} path={PL_PATH} />;
}
