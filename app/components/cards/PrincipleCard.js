import Icon from "../Icon";
import styles from "./PrincipleCard.module.css";

export default function PrincipleCard({ icon, title, text }) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
        <Icon name={icon} />
      </div>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}
