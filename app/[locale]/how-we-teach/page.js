import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import ConsultationButton from "../../components/ConsultationButton";
import CTASection from "../../components/CTASection";
import PrincipleCard from "../../components/cards/PrincipleCard";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

const ICONS = ["chat", "mic", "book", "spark", "globe", "target", "compass", "heart", "smile"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.howWeTeach.meta;
}

export default async function HowWeTeachPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.howWeTeach;

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
            <ConsultationButton />
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia kind="video" tone="blue" ratio="4:3" caption={t.hero.mediaCaption} />
        </Reveal>
      </div>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.principles.eyebrow} title={t.principles.title} subtitle={t.principles.subtitle} />
          <div>
            {t.principles.items.map((p, i) => (
              <Reveal as="div" key={p.title} delay={Math.min(i * 50, 300)}>
                <PrincipleCard icon={ICONS[i]} title={p.title} text={p.text} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            {t.inPractice.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["red", "cream", "sand", "blue"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">{t.inPractice.eyebrow}</span>
            <h2>{t.inPractice.title}</h2>
            <p>{t.inPractice.paragraph1}</p>
            <p>{t.inPractice.paragraph2}</p>
          </Reveal>
        </div>
      </section>

      <CTASection title={t.finalCta.title} subtitle={t.finalCta.subtitle} />
    </>
  );
}
