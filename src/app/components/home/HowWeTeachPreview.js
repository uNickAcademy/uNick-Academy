import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import Button from "../Button";
import PrincipleCard from "../cards/PrincipleCard";
import styles from "./HowWeTeachPreview.module.css";

const ICONS = ["chat", "mic", "spark", "globe", "heart", "smile"];

export default function HowWeTeachPreview({ dict, locale }) {
  const t = dict.home.howWeTeachPreview;

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.layout}`}>
        <Reveal as="div">
          <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
          <Button href={`/${locale}/how-we-teach`} variant="ghost">
            {dict.common.buttons.seeFullPhilosophy}
          </Button>
        </Reveal>

        <div className={styles.grid}>
          {t.principles.map((p, i) => (
            <Reveal as="div" key={p.title} delay={i * 60}>
              <PrincipleCard icon={ICONS[i]} title={p.title} text={p.text} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
