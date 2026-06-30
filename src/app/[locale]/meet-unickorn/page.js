import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import UNickorn from "../../components/UNickorn";
import CTASection from "../../components/CTASection";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.meetUnickorn.meta;
}

export default async function MeetUnickornPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.meetUnickorn;

  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1 className={styles.title}>
            {t.hero.titleStart}
            <span className={styles.accent}>{t.hero.titleAccent}</span>
          </h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
            <UNickorn variant="wave" size={200} float />
          </div>
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">{t.whatIs.eyebrow}</span>
            <h2>{t.whatIs.title}</h2>
            <p>{t.whatIs.paragraph1}</p>
            <p>{t.whatIs.paragraph2}</p>
          </Reveal>
          <Reveal as="div" delay={100} style={{ display: "flex", justifyContent: "center" }}>
            <UNickorn variant="happy" size={160} />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} />
          <Reveal as="ul" className={styles.checkList}>
            {t.features.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.howItWorks.eyebrow} title={t.howItWorks.title} />
          <div className={styles.stepList}>
            {t.howItWorks.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 80} className={styles.step}>
                <div className={styles.stepNumber}>0{i + 1}</div>
                <div>
                  <h3 className={styles.stepTitle}>{item.title}</h3>
                  <p className={styles.stepText}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title={t.cta.title}
        subtitle={t.cta.subtitle}
        signupHref="/zapisy"
        signupLabel={t.cta.tryButton || "Try uNickorn free"}
        secondaryHref="/zapisy"
        secondaryLabel={dict.common.buttons.signUp}
      />
    </>
  );
}
