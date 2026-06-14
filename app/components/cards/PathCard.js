import Link from "next/link";
import PlaceholderMedia from "../PlaceholderMedia";
import Icon from "../Icon";
import styles from "./PathCard.module.css";

export default function PathCard({ kicker, title, text, href, mediaCaption, tone, exploreLabel }) {
  return (
    <Link href={href} className={styles.card}>
      <PlaceholderMedia caption={mediaCaption} tone={tone} ratio="3:2" />
      <div className={styles.body}>
        <span className={styles.kicker}>{kicker}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>
        <span className={styles.link}>
          {exploreLabel} {kicker.toLowerCase()} <Icon name="arrowRight" size={16} />
        </span>
      </div>
    </Link>
  );
}
