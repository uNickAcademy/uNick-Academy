import Reveal from "../Reveal";
import ManifestoList from "../ManifestoList";
import styles from "./Manifesto.module.css";

export default function Manifesto({ dict }) {
  const t = dict.home.manifesto;

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <Reveal as="div" className={styles.heading}>
          <span className={`eyebrow ${styles.eyebrow}`}>{t.eyebrow}</span>
          <h2 className={styles.title}>{t.title}</h2>
        </Reveal>
        <ManifestoList items={t.beliefs} />
      </div>
    </section>
  );
}
