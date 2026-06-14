import PlaceholderMedia from "../PlaceholderMedia";
import styles from "./TeacherCard.module.css";

export default function TeacherCard({ name, country, role, quote, tone = "blue" }) {
  return (
    <div className={styles.card}>
      <PlaceholderMedia caption={`Portrait — ${name}, ${country}`} tone={tone} ratio="1:1" />
      <div className={styles.country}>
        <h3 className={styles.name}>{name}</h3>
        <span className={styles.flag}>{country}</span>
      </div>
      {role && <span className={styles.subject}>{role}</span>}
      <p className={styles.quote}>&ldquo;{quote}&rdquo;</p>
    </div>
  );
}
