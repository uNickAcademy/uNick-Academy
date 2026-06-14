import Reveal from "../Reveal";
import Button from "../Button";
import ConsultationButton from "../ConsultationButton";
import PlaceholderMedia from "../PlaceholderMedia";
import UNickorn from "../UNickorn";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <div className={`container ${styles.hero}`}>
      <Reveal as="div" className={styles.copy}>
        <span className={`eyebrow ${styles.eyebrow}`}>uNick Academy</span>
        <h1 className={styles.title}>
          English is about people.
          <br />
          <span className={styles.accent}>Not perfection.</span>
        </h1>
        <p className={styles.subtitle}>
          At uNick Academy, children, teenagers and adults learn to communicate
          through conversation, curiosity and genuine human connection.
        </p>
        <div className={styles.actions}>
          <ConsultationButton />
          <Button href="/how-we-teach" variant="secondary">
            See How We Teach
          </Button>
        </div>
      </Reveal>

      <Reveal as="div" delay={120} className={styles.media}>
        <PlaceholderMedia
          kind="video"
          tone="red"
          ratio="4:3"
          caption="Documentary footage — a real lesson, mid-conversation, candid and unscripted"
        />
        <UNickorn variant="wave" size={88} className={styles.unicorn} float />
      </Reveal>
    </div>
  );
}
