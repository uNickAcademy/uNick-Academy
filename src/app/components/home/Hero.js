import Image from "next/image";
import Reveal from "../Reveal";
import Button from "../Button";
import ConsultationButton from "../ConsultationButton";
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
        <div className={styles.heroImage}>
          <Image
            src="/team/team-hero.jpg"
            alt={t.mediaCaption}
            width={640}
            height={640}
            priority
            sizes="(max-width: 940px) 100vw, 50vw"
            className={styles.heroImg}
          />
        </div>
        <UNickorn variant="wave" size={88} className={styles.unicorn} float />
      </Reveal>
    </div>
  );
}
