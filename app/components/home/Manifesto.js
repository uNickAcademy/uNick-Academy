import Reveal from "../Reveal";
import ManifestoList from "../ManifestoList";
import styles from "./Manifesto.module.css";

const BELIEFS = [
  "Language is a bridge.",
  "Mistakes are courage.",
  "Nobody needs to sound perfect to deserve being heard.",
  "Curiosity matters more than grades.",
  "Everyone has a story worth telling.",
  "Learning should help people become more themselves.",
];

export default function Manifesto() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <Reveal as="div" className={styles.heading}>
          <span className={`eyebrow ${styles.eyebrow}`}>Our manifesto</span>
          <h2 className={styles.title}>What we believe</h2>
        </Reveal>
        <ManifestoList items={BELIEFS} />
      </div>
    </section>
  );
}
