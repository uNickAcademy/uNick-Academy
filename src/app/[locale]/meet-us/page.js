import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import PlaceholderMedia from "../../components/PlaceholderMedia";
import Image from "next/image";
import CTASection from "../../components/CTASection";
import TeacherGrid from "../../components/cards/TeacherGrid";
import { getTeachers } from "../../lib/teachers";
import { getDictionary } from "../../lib/dictionaries";
import { getTeacherPublicProfiles } from "@/lib/supabase/queries";
import styles from "../../components/sections.module.css";

// Teacher photos come from Supabase and can change between deploys (self-service upload),
// so revalidate periodically instead of freezing them at build time forever.
export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.meetUs.meta;
}

export default async function MeetUsPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.meetUs;
  const profiles = await getTeacherPublicProfiles();
  const teachers = getTeachers(dict).map((teacher) => {
    const profile = profiles[teacher.id];
    return {
      ...teacher,
      photo: profile?.photo || teacher.photo,
      bio: profile?.bio || "",
      video: profile?.video || null,
      availability: profile?.availability || [],
    };
  });

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
          <div className={styles.videoWrap}>
            <iframe
              src="https://www.youtube.com/embed/W3c0GcLv8Ag"
              title={t.hero.mediaCaption}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            {[
              { src: "/team/milly-nick.jpg", caption: t.ourStory.galleryCaptions[0] },
              { src: "/team/first-team.jpg", caption: t.ourStory.galleryCaptions[1] },
              { src: "/team/kids-learning.jpg", caption: t.ourStory.galleryCaptions[2] },
              { src: "/team/nick-first-lessons.jpg", caption: t.ourStory.galleryCaptions[3] },
            ].map(({ src, caption }) => (
              <figure key={src} className={styles.galleryItem}>
                <div className={styles.galleryImageWrap}>
                  <Image src={src} alt={caption} fill sizes="(max-width: 768px) 50vw, 25vw" className={styles.galleryImage} />
                </div>
                <figcaption className={styles.galleryCaption}>{caption}</figcaption>
              </figure>
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
          <TeacherGrid teachers={teachers} dict={dict} cardGridClassName={styles.cardGrid} />
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
