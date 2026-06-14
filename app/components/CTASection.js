import ConsultationButton from "./ConsultationButton";
import Button from "./Button";
import UNickorn from "./UNickorn";
import Reveal from "./Reveal";
import styles from "./CTASection.module.css";

export default function CTASection({
  title = "Ready to start speaking?",
  subtitle = "Tell us who you are, and we’ll help you find your people.",
  secondaryHref,
  secondaryLabel,
  audience,
  showUnicorn = true,
}) {
  return (
    <Reveal as="div" className="section container">
      <div className={styles.section}>
        <div className={styles.inner}>
          {showUnicorn && <UNickorn variant="wave" size={64} className={styles.unicorn} float />}
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
          <div className={styles.actions}>
            <ConsultationButton audience={audience} />
            {secondaryHref && (
              <Button href={secondaryHref} variant="secondary" onDark>
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
