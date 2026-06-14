import Reveal from "../Reveal";
import Button from "../Button";
import ConsultationButton from "../ConsultationButton";
import PlaceholderMedia from "../PlaceholderMedia";
import UNickorn from "../UNickorn";
import styles from "./Hero.module.css";

export default function Hero({ dict, locale }) {
  const t = dict.home.hero;

  return (
    <div className={`container ${styles.hero}`}>
      <Reveal as="div" className={styles.copy}>
        <span className={`eyebrow ${styles.eyebrow}`}>{t.eyebrow}</span>
        <h1 className={styles.title}>
          {t.titleLine1}
          <br />
          <span className={styles.accent}>{t.titleAccent}</span>
        </h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
        <div className={styles.actions}>
          <ConsultationButton>{dict.common.buttons.bookConsultation}</ConsultationButton>
          <Button href={`/${locale}/how-we-teach`} variant="secondary">
            {dict.common.buttons.seeHowWeTeach}
          </Button>
        </div>
      </Reveal>

      <Reveal as="div" delay={120} className={styles.media}>
        <PlaceholderMedia kind="video" tone="red" ratio="4:3" caption={t.mediaCaption} />
        <UNickorn variant="wave" size={88} className={styles.unicorn} float />
      </Reveal>
    </div>
  );
}
