import Link from "next/link";
import { FORM_CLOSES_LABEL, isFormOpen } from "@/lib/availability/window";
import styles from "./AvailabilityBanner.module.css";

/**
 * TYMCZASOWY pasek na stronie głównej — link do formularza dostępności
 * na rok szkolny 2026/2027.
 *
 * Znika sam po 7.09.2026 (patrz `isFormOpen`), więc nie trzeba pilnować
 * terminu. Trwałe usunięcie: skasuj import i jedną linijkę w
 * `src/app/[locale]/page.js` — reszta naboru opisana jest w
 * docs/FORMULARZ-DOSTEPNOSCI.md.
 */
export default function AvailabilityBanner({ locale }) {
  // Formularz jest tylko po polsku — na /en pasek się nie pokazuje.
  if (locale !== "pl" || !isFormOpen()) return null;

  return (
    <aside className={styles.banner}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.text}>
          <strong>Układamy grafik na rok szkolny 2026/2027.</strong> Powiedz nam, kiedy Ty lub
          Twoje dziecko macie wolne — zbieramy terminy do {FORM_CLOSES_LABEL}.
        </p>
        <Link href="/pl/dostepnosc" className={styles.cta}>
          Wypełnij formularz
        </Link>
      </div>
    </aside>
  );
}
