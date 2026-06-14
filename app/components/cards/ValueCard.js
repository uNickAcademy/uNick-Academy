import styles from "./ValueCard.module.css";

export default function ValueCard({ icon, title, description }) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
        {icon}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
