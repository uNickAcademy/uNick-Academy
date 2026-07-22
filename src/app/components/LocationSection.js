import Link from "next/link";
import AddressBlock from "./AddressBlock";
import { siteConfig } from "../lib/site-config";
import styles from "./sections.module.css";

// Sekcja lokalna: adres (NAP jako tekst), przyciski Zadzwoń/Napisz/Trasa,
// osadzona mapa Google (bez klucza API, przez output=embed) oraz informacja
// o dojeździe z okolicznych miejscowości. Reużywana na stronie głównej,
// kontaktowej i lokalnej.
//
// showLocalLink: pokaż link do lokalnej strony docelowej (na home/kontakt tak,
// na samej stronie lokalnej — nie).
export default function LocationSection({ dict, locale, showLocalLink = true }) {
  const t = dict.common.location;
  const localHref =
    locale === "en"
      ? `/en/english-school-tarnowo-podgorne`
      : `/pl/szkola-jezykowa-tarnowo-podgorne`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(siteConfig.mapsQuery)}&z=13&output=embed`;

  return (
    <section className="section" aria-labelledby="location-heading">
      <div className={`container ${styles.split}`}>
        <div className={styles.copy}>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 id="location-heading">{t.title}</h2>
          <p>{t.body}</p>
          <AddressBlock dict={dict} variant="full" />
          <p style={{ marginTop: "1.1rem" }}>{t.commuting}</p>
          {showLocalLink && (
            <p>
              <Link href={localHref} style={{ fontWeight: 700, color: "var(--color-red)" }}>
                {t.localPageLink} →
              </Link>
            </p>
          )}
        </div>
        <div>
          <iframe
            title={t.mapAria}
            src={mapSrc}
            width="100%"
            height="360"
            style={{ border: 0, borderRadius: "16px", minHeight: "300px" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
