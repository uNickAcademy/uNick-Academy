import Reveal from "../Reveal";
import Button from "../Button";
import PlaceholderMedia from "../PlaceholderMedia";
import styles from "./Founders.module.css";

export default function Founders({ dict, locale }) {
  const t = dict.home.founders;

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal as="div" className={styles.gallery}>
          <PlaceholderMedia
            className={styles.galleryMain}
            tone="blue"
            ratio="3:4"
            caption={t.galleryCaptions[0]}
          />
          <PlaceholderMedia tone="cream" ratio="1:1" caption={t.galleryCaptions[1]} />
          <PlaceholderMedia tone="sand" ratio="1:1" caption={t.galleryCaptions[2]} />
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
