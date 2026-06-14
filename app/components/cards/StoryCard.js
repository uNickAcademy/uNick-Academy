import styles from "./StoryCard.module.css";

export default function StoryCard({ quote, who, context }) {
  return (
    <div className={styles.card}>
      <span className={styles.mark} aria-hidden="true">
        &ldquo;
      </span>
      <p className={styles.quote}>{quote}</p>
      <div className={styles.meta}>
        <span className={styles.avatar} aria-hidden="true" />
        <div>
          <div className={styles.who}>{who}</div>
          <div className={styles.context}>{context}</div>
        </div>
      </div>
    </div>
  );
}
