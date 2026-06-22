import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import UNickorn from "../../components/UNickorn";
import ConsultationButton from "../../components/ConsultationButton";
import Button from "../../components/Button";
import CTASection from "../../components/CTASection";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.children.meta;
}

export default async function ChildrenPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.children;

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
          <div className={styles.actions}>
            <ConsultationButton audience="child" />
            <Button href="#a-day" variant="secondary">
              {dict.common.buttons.seeADayInClass}
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia kind="video" tone="red" ratio="4:3" caption={t.hero.mediaCaption} />
          <UNickorn variant="trophy" size={84} className={styles.unicornCorner} float />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            {t.intro.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["blue", "cream", "sand", "red"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">{t.intro.eyebrow}</span>
            <h2>{t.intro.title}</h2>
            <p>{t.intro.paragraph1}</p>
            <p>{t.intro.paragraph2}</p>
          </Reveal>
        </div>
      </section>

      <section className="section" id="a-day">
        <div className="container">
          <SectionHeading eyebrow={t.day.eyebrow} title={t.day.title} subtitle={t.day.subtitle} />
          <div className={styles.timeline}>
            {t.day.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 60} className={styles.timelineItem}>
                <span className={styles.timelineTime}>{item.time}</span>
                <div>
                  <h3 className={styles.timelineTitle}>{item.title}</h3>
                  <p className={styles.timelineText}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.reassurances.eyebrow} title={t.reassurances.title} subtitle={t.reassurances.subtitle} />
          <div className={styles.cardGrid}>
            {t.reassurances.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 80} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title={t.finalCta.title}
        subtitle={t.finalCta.subtitle}
        signupHref="/academy/signup"
        signupLabel={dict.common.buttons.signUp}
        secondaryHref={`/${locale}/how-we-teach`}
        secondaryLabel={dict.common.buttons.seeHowWeTeach}
      />
    </>
  );
}
