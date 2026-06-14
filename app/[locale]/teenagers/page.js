import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import ConsultationButton from "../../components/ConsultationButton";
import Button from "../../components/Button";
import CTASection from "../../components/CTASection";
import TeacherCard from "../../components/cards/TeacherCard";
import { getTeachers } from "../../lib/teachers";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.teenagers.meta;
}

export default async function TeenagersPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.teenagers;
  const teenTeachers = getTeachers(dict)
    .filter((teacher) => teacher.audiences.includes("teen"))
    .slice(0, 2);

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
            <ConsultationButton audience="teen" />
            <Button href={`/${locale}/how-we-teach`} variant="secondary">
              {dict.common.buttons.seeHowWeTeachLower}
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia kind="video" tone="blue" ratio="4:3" caption={t.hero.mediaCaption} />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">{t.realTalk.eyebrow}</span>
            <h2>{t.realTalk.title}</h2>
            <p>{t.realTalk.paragraph1}</p>
            <p>{t.realTalk.paragraph2}</p>
          </Reveal>
          <Reveal as="div" delay={100} className={styles.gallery}>
            {t.realTalk.galleryCaptions.map((caption, i) => (
              <PlaceholderMedia key={caption} tone={["red", "cream", "sand", "blue"][i]} ratio="1:1" caption={caption} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.topics.eyebrow} title={t.topics.title} subtitle={t.topics.subtitle} />
          <div className={styles.cardGrid}>
            {t.topics.items.map((item, i) => (
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
          <SectionHeading eyebrow={t.findingVoice.eyebrow} title={t.findingVoice.title} subtitle={t.findingVoice.subtitle} />
          <div className={styles.timeline}>
            {t.findingVoice.items.map((item, i) => (
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

      {teenTeachers.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow={t.teachersSection.eyebrow} title={t.teachersSection.title} center />
            <div className={styles.cardGrid}>
              {teenTeachers.map((teacher, i) => (
                <Reveal as="div" key={teacher.name} delay={i * 80}>
                  <TeacherCard {...teacher} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        title={t.finalCta.title}
        subtitle={t.finalCta.subtitle}
        audience="teen"
        secondaryHref={`/${locale}/meet-us`}
        secondaryLabel={dict.common.buttons.meetTheTeam}
        showUnicorn={false}
      />
    </>
  );
}
