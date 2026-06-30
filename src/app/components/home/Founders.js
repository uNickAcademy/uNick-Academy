import Reveal from "../Reveal";
import Button from "../Button";
import Image from "next/image";
import styles from "./Founders.module.css";

export default function Founders({ dict, locale }) {
  const t = dict.home.founders;

  const photos = [
    { src: "/team/milly-nick.jpg",        caption: t.galleryCaptions[0] },
    { src: "/team/first-team.jpg",        caption: t.galleryCaptions[1] },
    { src: "/team/kids-learning.jpg",     caption: t.galleryCaptions[2] },
    { src: "/team/nick-first-lessons.jpg",caption: t.galleryCaptions[3] },
  ];

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal as="div" className={styles.gallery}>
          {photos.map(({ src, caption }) => (
            <figure key={src} className={styles.galleryItem}>
              <div className={styles.galleryImageWrap}>
                <Image src={src} alt={caption} fill sizes="(max-width: 768px) 50vw, 25vw" className={styles.galleryImage} />
              </div>
              <figcaption className={styles.galleryCaption}>{caption}</figcaption>
            </figure>
          ))}
        </Reveal>

        <Reveal as="div" delay={120} className={styles.copy}>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className={styles.title}>
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h2>
          <p>{t.paragraph1}</p>
          <p>{t.paragraph2}</p>
          {t.paragraph3 && <p>{t.paragraph3}</p>}
          <p className={styles.signature}>{t.signature}</p>
          <Button href={`/${locale}/meet-us`} variant="ghost">
            {dict.common.buttons.readFullStory}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
