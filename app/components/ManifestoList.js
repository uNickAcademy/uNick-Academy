import Reveal from "./Reveal";
import styles from "./ManifestoList.module.css";

export default function ManifestoList({ items }) {
  return (
    <div className={styles.list}>
      {items.map((item, i) => (
        <Reveal as="div" key={item} delay={i * 60} className={styles.item}>
          <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
          <p className={styles.text}>{item}</p>
        </Reveal>
      ))}
    </div>
  );
}
