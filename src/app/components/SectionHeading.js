import styles from "./SectionHeading.module.css";

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  onDark = false,
  as: Tag = "h2",
  className = "",
}) {
  return (
    <div
      className={`${styles.wrap} ${center ? styles.center : ""} ${onDark ? styles.onDark : ""} ${className}`.trim()}
    >
      {eyebrow && <span className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</span>}
      <Tag className={styles.title}>{title}</Tag>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
