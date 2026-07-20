import Link from "next/link";
import ClassGroupItem from "./ClassGroupItem";
import styles from "./ClassesShowcase.module.css";

function GroupList({ groups, locale, t }) {
  return (
    <ul className={styles.list}>
      {groups.map((g) => (
        <ClassGroupItem key={g.id} group={g} locale={locale} t={t} />
      ))}
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
