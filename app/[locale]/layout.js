import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { ConsultationProvider } from "../components/ConsultationProvider";
import { SetHtmlLang } from "../components/SetHtmlLang";
import { siteConfig } from "../lib/site-config";
import { getDictionary, locales } from "../lib/dictionaries";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Any locale segment outside `locales` (e.g. /admin, /logowanie) is not a
// real locale — let it 404 instead of rendering a bogus page.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: dict.meta.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: dict.meta.description,
    openGraph: {
      title: siteConfig.name,
      description: dict.meta.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: dict.meta.description,
    },
    alternates: {
      languages: {
        en: "/en",
        pl: "/pl",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <ConsultationProvider locale={locale}>
      <SetHtmlLang locale={locale} />
      <a href="#main-content" className="visually-hidden">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={locale} dict={dict} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} dict={dict} />
      <CookieBanner locale={locale} dict={dict} />
    </ConsultationProvider>
  );
}
