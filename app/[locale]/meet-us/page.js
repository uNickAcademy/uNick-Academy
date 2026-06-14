import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import ConsultationButton from "../../components/ConsultationButton";
import CTASection from "../../components/CTASection";
import TeacherCard from "../../components/cards/TeacherCard";
import { getTeachers } from "../../lib/teachers";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.meetUs.meta;
}

export default async function MeetUsPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.meetUs;
  const teachers = getTeachers(dict);

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
          <PlaceholderMedia tone="cream" ratio="4:3" caption={t.hero.mediaCaption} />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            {t.ourStory.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["blue", "red", "sand", "cream"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">{t.ourStory.eyebrow}</span>
            <h2>{t.ourStory.title}</h2>
            <p>{t.ourStory.paragraph1}</p>
            <p>{t.ourStory.paragraph2}</p>
            <p>{t.ourStory.paragraph3}</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.team.eyebrow} title={t.team.title} subtitle={t.team.subtitle} />
          <div className={styles.cardGrid}>
            {teachers.map((teacher, i) => (
              <Reveal as="div" key={teacher.name} delay={Math.min(i * 60, 300)}>
                <TeacherCard {...teacher} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.lookFor.eyebrow} title={t.lookFor.title} />
          <div className={styles.cardGrid}>
            {t.lookFor.items.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={t.finalCta.title} subtitle={t.finalCta.subtitle} />
    </>
  );
}
