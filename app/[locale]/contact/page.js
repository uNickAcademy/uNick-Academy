import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import UNickorn from "../../components/UNickorn";
import ContactForm from "../../components/ContactForm";
import { siteConfig, platformLinks } from "../../lib/site-config";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.contact.meta;
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.contact;

  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1 className={styles.title}>
            {t.hero.titleStart}
            <span className={styles.accent}>{t.hero.titleAccent}</span>
            {t.hero.titleEnd}
          </h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia tone="red" ratio="4:3" caption={t.hero.mediaCaption} />
          <UNickorn variant="sign" signText={t.hero.unicornSignText} size={64} className={styles.unicornCorner} float />
        </Reveal>
      </div>

      <section className="section">
        <div className={`container ${styles.split}`}>
          <Reveal as="div">
            <ContactForm dict={dict} />
          </Reveal>

          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">{t.otherWays.eyebrow}</span>
            <h2>{t.otherWays.title}</h2>
            <p>
              {t.otherWays.emailPrefix}
              <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--color-red)", fontWeight: 700 }}>
                {siteConfig.email}
              </a>
              {t.otherWays.emailSuffix}
            </p>
            <p>
              {t.otherWays.socialPrefix}
              <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" style={{ color: "var(--color-red)", fontWeight: 700 }}>
                {t.otherWays.instagram}
              </a>
              {t.otherWays.socialMiddle}
              <a href={siteConfig.social.facebook} target="_blank" rel="noreferrer" style={{ color: "var(--color-red)", fontWeight: 700 }}>
                {t.otherWays.facebook}
              </a>
              {t.otherWays.socialSuffix}
            </p>
            <p>
              {t.otherWays.loginPrefix}
              <a href={platformLinks.studentLogin.href} style={{ color: "var(--color-blue)", fontWeight: 700 }}>
                {dict.common.platformLinks.studentLogin}
              </a>
              {t.otherWays.loginSuffix}
            </p>
            <PlaceholderMedia tone="sand" ratio="3:2" caption={t.otherWays.mapCaption} />
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
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
    </>
  );
}
