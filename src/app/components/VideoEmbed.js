import styles from "./VideoEmbed.module.css";

/**
 * Osadzone wideo YouTube (responsywne 16:9), spójne stylistycznie z
 * PlaceholderMedia — zaokrąglone rogi, cień, opcjonalny podpis pod ramką.
 *
 * id: identyfikator filmu YouTube (np. "3X5nm93gqzE")
 * title: tytuł dla dostępności / atrybut title iframe
 * caption: opcjonalny podpis pod nagraniem
 */
export default function VideoEmbed({ id, title = "uNick Academy", caption, className = "" }) {
  return (
    <figure className={`${styles.wrap} ${className}`.trim()}>
      <div className={styles.frame}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
