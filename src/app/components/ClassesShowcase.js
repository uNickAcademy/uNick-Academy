import { ActiveNowForm } from "./ActiveNowForm";
import styles from "./ClassesShowcase.module.css";

/**
 * Sekcja zapisów. Wcześniej wypisywała grupy pobrane z naszej bazy i odsyłała
 * do własnego kreatora. Zajęcia i płatności prowadzimy teraz w ActiveNow, więc
 * zamiast listy grup osadzamy wprost ich formularze zapisu: grupowy i
 * indywidualny. Aktualne grupy i wolne miejsca pokazuje sam formularz.
 */
export default function ClassesShowcase({ t }) {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockTitle}>{t.groupTitle}</h3>
            <p className={styles.blockText}>{t.groupText}</p>
          </div>
          <div className={styles.panel}>
            <ActiveNowForm form="grupowe" />
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockTitle}>{t.individualTitle}</h3>
            <p className={styles.blockText}>{t.individualText}</p>
          </div>
          <div className={styles.panel}>
            <ActiveNowForm form="indywidualne" />
          </div>
        </div>
      </div>
    </section>
  );
}
