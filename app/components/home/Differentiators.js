import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import ValueCard from "../cards/ValueCard";
import Icon from "../Icon";
import styles from "./Differentiators.module.css";

const ICONS = ["globe", "mic", "heart", "puzzle"];

export default function Differentiators({ dict }) {
  const t = dict.home.differentiators;

  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className={styles.grid}>
          {t.items.map((item, i) => (
            <Reveal as="div" key={item.title} delay={i * 80}>
              <ValueCard icon={<Icon name={ICONS[i]} />} title={item.title} description={item.description} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
