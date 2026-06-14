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
  return dict.adults.meta;
}

export default async function AdultsPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.adults;

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
            <ConsultationButton audience="adult" />
            <Button href={`/${locale}/how-we-teach`} variant="secondary">
              {dict.common.buttons.seeHowWeTeachLower}
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia kind="video" tone="cream" ratio="4:3" caption={t.hero.mediaCaption} />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            {t.whyStuck.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["blue", "red", "sand", "cream"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">{t.whyStuck.eyebrow}</span>
            <h2>{t.whyStuck.title}</h2>
            <p>{t.whyStuck.paragraph1}</p>
            <p>{t.whyStuck.paragraph2}</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.formats.eyebrow} title={t.formats.title} />
          <div className={styles.cardGrid}>
            {t.formats.items.map((item, i) => (
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
          <SectionHeading eyebrow={t.scenarios.eyebrow} title={t.scenarios.title} subtitle={t.scenarios.subtitle} />
          <div className={styles.cardGrid}>
            {t.scenarios.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
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
        audience="adult"
        secondaryHref={`/${locale}/meet-us`}
        secondaryLabel={dict.common.buttons.meetTheTeam}
      />
    </>
  );
}
