import Link from "next/link";
import styles from "./ClassesShowcase.module.css";

const DAYS = {
  pl: ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

function ageText(min, max) {
  if (min != null && max != null) return `${min}–${max} lat`;
  if (min != null) return `${min}+`;
  if (max != null) return `do ${max} lat`;
  return "";
}

function GroupList({ groups, locale, t }) {
  const days = DAYS[locale] || DAYS.pl;
  return (
    <ul className={styles.list}>
      {groups.map((g) => {
        const full = g.spots <= 0;
        const levels = g.levels && g.levels.length ? g.levels : (g.level ? [g.level] : []);
        const day = g.dayOfWeek != null ? days[g.dayOfWeek] : "";
        return (
          <li key={g.id} className={styles.item}>
            <div className={styles.itemMain}>
              <span className={styles.itemName}>{g.name}</span>
              <span className={styles.meta}>
                {[day, g.schedule_text].filter(Boolean).join(" · ")}
                {ageText(g.ageMin, g.ageMax) ? ` · ${ageText(g.ageMin, g.ageMax)}` : ""}
              </span>
              {levels.length > 0 && (
                <span className={styles.levels}>
                  {levels.map((lv) => <span key={lv} className={styles.level}>{lv}</span>)}
                </span>
              )}
            </div>
            <div className={styles.itemSide}>
              {g.pricePerMonth != null && <span className={styles.price}>{g.pricePerMonth} {t.perMonth}</span>}
              <span className={full ? styles.spotsFull : styles.spots}>
                {full ? t.full : `${g.spots} ${t.spots}`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function ClassesShowcase({ t, locale, stationary, online }) {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {/* Stacjonarne */}
          <div className={styles.col}>
            <div className={styles.colHead}>
              <h3 className={styles.colTitle}>{t.stationaryTitle}</h3>
              <span className={styles.colSub}>{t.stationarySubtitle}</span>
            </div>
            {stationary.length > 0
              ? <GroupList groups={stationary} locale={locale} t={t} />
              : <p className={styles.empty}>{t.emptyStationary}</p>}
            <Link href="/zapisy?tryb=grupa&forma=offline" className={styles.cta}>{t.signUp}</Link>
          </div>

          {/* Online */}
          <div className={styles.col}>
            <div className={styles.colHead}>
              <h3 className={styles.colTitle}>{t.onlineTitle}</h3>
              <span className={styles.colSub}>{t.onlineSubtitle}</span>
            </div>
            {online.length > 0
              ? <GroupList groups={online} locale={locale} t={t} />
              : <p className={styles.empty}>{t.emptyOnline}</p>}
            <Link href="/zapisy?tryb=grupa&forma=online" className={styles.cta}>{t.signUp}</Link>
          </div>
        </div>

        {/* Lekcje indywidualne */}
        <div className={styles.individual}>
          <div>
            <h3 className={styles.individualTitle}>{t.individualTitle}</h3>
            <p className={styles.individualText}>{t.individualText}</p>
          </div>
          <Link href="/zapisy?tryb=indywidualnie" className={styles.individualCta}>{t.individualCta}</Link>
        </div>
      </div>
    </section>
  );
}
