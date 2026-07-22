import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import ConsultationButton from "./ConsultationButton";
import CTASection from "./CTASection";
import LocationSection from "./LocationSection";
import JsonLd from "./JsonLd";
import { getDictionary } from "../lib/dictionaries";
import {
  breadcrumbNode,
  webPageNode,
  faqNode,
  courseNode,
} from "../lib/structured-data";
import { siteConfig } from "../lib/site-config";
import styles from "./sections.module.css";

// Wspólny szablon lokalnej strony docelowej (PL i EN korzystają z tego samego
// układu; różni je slug i język treści z dictionary). Sekcje są widoczne
// bezpośrednio w HTML (nie chowamy oferty w akordeonach), a FAQ i Course
// trafiają do danych strukturalnych.
export default function LocalLanding({ locale, path }) {
  const dict = getDictionary(locale);
  const t = dict.localTarnowo;

  const jsonLd = [
    webPageNode({ name: t.meta.title, description: t.meta.description, path, locale }),
    breadcrumbNode([
      { name: siteConfig.name, path: `/${locale}` },
      { name: t.hero.eyebrow, path: `/${locale}${path}` },
    ]),
    faqNode(t.faq.items.map((i) => ({ question: i.title, answer: i.text }))),
    {
      "@context": "https://schema.org",
      "@graph": t.offer.items.slice(0, 4).map((item) =>
        courseNode({
          name: item.title,
          description: item.text,
          path: `/${locale}${path}`,
          courseMode: ["onsite", "online"],
        }),
      ),
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1 className={styles.title}>{t.hero.title}</h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
          <div className={styles.actions}>
            <ConsultationButton audience="unsure" />
            <Button href={`/${locale}/contact`} variant="secondary">
              {dict.common.buttons.contactUs}
            </Button>
          </div>
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <Reveal as="div">
            <h2>{t.intro.title}</h2>
            <p style={{ maxWidth: "60ch" }}>{t.intro.body}</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.offer.eyebrow} title={t.offer.title} />
          <div className={styles.cardGrid}>
            {t.offer.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 60} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
          <div className={styles.actions} style={{ marginTop: "1.5rem", flexWrap: "wrap" }}>
            <Button href={`/${locale}/children`} variant="ghost">
              {dict.common.nav.children}
            </Button>
            <Button href={`/${locale}/teenagers`} variant="ghost">
              {dict.common.nav.teenagers}
            </Button>
            <Button href={`/${locale}/adults`} variant="ghost">
              {dict.common.nav.adults}
            </Button>
            <Button href={`/${locale}/companies`} variant="ghost">
              {dict.common.nav.companies}
            </Button>
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <Reveal as="div">
            <span className="eyebrow">{t.method.eyebrow}</span>
            <h2>{t.method.title}</h2>
            <p style={{ maxWidth: "60ch" }}>{t.method.body}</p>
            <p>
              <Button href={`/${locale}/how-we-teach`} variant="secondary">
                {dict.common.buttons.seeHowWeTeach}
              </Button>
            </p>
          </Reveal>
        </div>
      </section>

      <LocationSection dict={dict} locale={locale} showLocalLink={false} />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
          <div className={styles.cardGrid}>
            {t.faq.items.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title={t.cta.title}
        subtitle={t.cta.subtitle}
        signupHref={`/${locale}/contact`}
        signupLabel={dict.common.buttons.bookConsultation}
        secondaryHref={`/${locale}/meet-us`}
        secondaryLabel={dict.common.buttons.meetTheTeam}
      />
    </>
  );
}
