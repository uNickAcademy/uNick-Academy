import ConsultationButton from "./ConsultationButton";
import Button from "./Button";
import UNickorn from "./UNickorn";
import Reveal from "./Reveal";
import styles from "./CTASection.module.css";

export default function CTASection({
  title,
  subtitle,
  secondaryHref,
  secondaryLabel,
  audience,
  showUnicorn = true,
  signupHref,
  signupLabel,
}) {
  return (
    <Reveal as="div" className="section container">
      <div className={styles.section}>
        <div className={styles.inner}>
          {showUnicorn && <UNickorn variant="wave" size={64} className={styles.unicorn} float />}
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
          <div className={styles.actions}>
            {signupHref ? (
              <Button href={signupHref} variant="primary" onDark>
                {signupLabel}
              </Button>
            ) : (
              <ConsultationButton audience={audience} />
            )}
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
