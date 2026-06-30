import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import CTASection from "../../components/CTASection";
import TeacherCardWithBooking from "../../components/cards/TeacherCardWithBooking";
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
          </h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
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
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">{t.worldTeam.eyebrow}</span>
            <h2>{t.worldTeam.title}</h2>
            <p>{t.worldTeam.paragraph1}</p>
            <p>{t.worldTeam.paragraph2}</p>
            <p className={styles.signature}>{t.worldTeam.signature}</p>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.whatWeOffer.eyebrow} title={t.whatWeOffer.title} />
          <Reveal as="ul" className={styles.checkList}>
            {t.whatWeOffer.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.team.eyebrow} title={t.team.title} subtitle={t.team.subtitle} />
          <div className={styles.cardGrid}>
            {teachers.map((teacher, i) => (
              <Reveal as="div" key={teacher.name} delay={Math.min(i * 60, 300)}>
                <TeacherCardWithBooking {...teacher} bookLabel={dict.common.buttons.bookLesson || "Book a lesson"} />
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
      />
    </>
  );
}
