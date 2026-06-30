import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import ConsultationButton from "../../components/ConsultationButton";
import Button from "../../components/Button";
import CTASection from "../../components/CTASection";
import StoryCard from "../../components/cards/StoryCard";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.companies.meta;
}

export default async function CompaniesPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.companies;

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
            <ConsultationButton audience="company" />
            <Button href={`/${locale}/how-we-teach`} variant="secondary">
              {dict.common.buttons.seeHowWeTeachLower}
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia kind="video" tone="sand" ratio="4:3" caption={t.hero.mediaCaption} />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">{t.whyNotWork.eyebrow}</span>
            <h2>{t.whyNotWork.title}</h2>
            <p>{t.whyNotWork.paragraph1}</p>
            <p>{t.whyNotWork.paragraph2}</p>
          </Reveal>
          <Reveal as="div" delay={100} className={styles.gallery}>
            {t.whyNotWork.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["blue", "red", "cream", "sand"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.offers.eyebrow} title={t.offers.title} />
          <div className={styles.cardGrid}>
            {t.offers.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.process.eyebrow} title={t.process.title} />
          <div className={styles.stepList}>
            {t.process.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 60} className={styles.step}>
                <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.stepTitle}>{item.title}</h3>
                  <p className={styles.stepText}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.stories.eyebrow} title={t.stories.title} />
          <div className={styles.cardGrid}>
            {t.stories.items.map((story, i) => (
              <Reveal as="div" key={story.who} delay={i * 70}>
                <StoryCard {...story} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title={t.finalCta.title}
        subtitle={t.finalCta.subtitle}
        signupHref="/zapisy"
        signupLabel={dict.common.buttons.signUp}
        secondaryHref={`/${locale}/contact`}
        secondaryLabel={dict.common.buttons.contactUs}
        showUnicorn={false}
      />
    </>
  );
}
