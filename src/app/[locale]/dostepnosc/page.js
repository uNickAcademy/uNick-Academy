import Image from "next/image";
import { redirect } from "next/navigation";
import Reveal from "../../components/Reveal";
import UNickorn from "../../components/UNickorn";
import Button from "../../components/Button";
import AvailabilityForm from "../../components/availability/AvailabilityForm";
import { siteConfig } from "../../lib/site-config";
import { buildMetadata } from "../../lib/seo";
import { FORM_CLOSES_LABEL, isFormOpen } from "@/lib/availability/window";
import styles from "./AvailabilityPage.module.css";

// ============================================================
// Formularz dostępności na rok szkolny 2026/2027 — strona TYMCZASOWA.
// Nabór trwa jeden tydzień; po 7.09.2026 strona sama pokazuje komunikat
// o zamknięciu. Instrukcja usunięcia: docs/FORMULARZ-DOSTEPNOSCI.md.
// ============================================================

const TITLE = "Dostępność na nowy rok szkolny";
const DESCRIPTION =
  "Powiedz nam, kiedy Ty lub Twoje dziecko macie wolne, a ułożymy grafik zajęć angielskiego pod prawdziwe terminy rodzin.";

// Strona jest prerenderowana, a data zamknięcia to zwykłe porównanie czasu —
// bez odświeżania wisiałby formularz jeszcze długo po terminie. Godzina to
// wystarczająca dokładność dla naboru liczonego w dniach.
export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    ...buildMetadata({
      locale: "pl",
      path: "/dostepnosc",
      title: TITLE,
      description: DESCRIPTION,
      availableLocales: ["pl"],
    }),
    // Tymczasowy nabór nie ma czego robić w wynikach wyszukiwania — po
    // usunięciu strony zostałby po nim martwy link.
    robots: { index: false, follow: true },
    ...(locale === "pl" ? {} : { alternates: { canonical: "/pl/dostepnosc" } }),
  };
}

export default async function AvailabilityPage({ params }) {
  const { locale } = await params;
  // Formularz istnieje tylko po polsku — wersja angielska wraca na polską.
  if (locale !== "pl") redirect("/pl/dostepnosc");

  const open = isFormOpen();

  return (
    <>
      <div className={styles.banner}>
        <Image
          src="/availability/banner.jpg"
          alt="uNickorn, maskotka uNick Academy, w klasie językowej"
          width={2172}
          height={724}
          priority
          sizes="100vw"
          className={styles.bannerImage}
        />
      </div>

      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <Reveal className={styles.heroCopy}>
            <span className="eyebrow">Rok szkolny 2026/2027</span>
            <h1>
              Kiedy Wam <span className={styles.accent}>pasuje</span>?
            </h1>
            <p className={styles.lead}>
              Układamy grafik na nowy rok szkolny i chcemy go dopasować do prawdziwych terminów
              rodzin, a nie do tabelki. Zaznacz, kiedy jesteście wolni — resztę policzymy sami.
            </p>
            <p className={styles.meta}>
              {open
                ? `Formularz zbiera zgłoszenia do ${FORM_CLOSES_LABEL}. Wypełnienie zajmuje około dwóch minut.`
                : `Zbieranie dostępności zakończyliśmy ${FORM_CLOSES_LABEL}.`}
            </p>
          </Reveal>
          <Reveal className={styles.heroMascot} delay={120}>
            <UNickorn variant="wave" size={180} float />
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.formSection}`}>
        <div className={`container ${styles.formWrap}`}>
          {open ? (
            <AvailabilityForm locale="pl" />
          ) : (
            <div className={styles.closed} role="status">
              <UNickorn variant="trophy" size={84} />
              <h2>Formularz jest już zamknięty</h2>
              <p>
                Dziękujemy wszystkim, którzy podesłali swoje terminy — grafik na rok szkolny
                2026/2027 jest już układany. Jeśli chcesz zapisać siebie albo dziecko na zajęcia,
                napisz albo zadzwoń, a znajdziemy miejsce.
              </p>
              <div className={styles.closedActions}>
                <Button href={`mailto:${siteConfig.email}`}>Napisz do nas</Button>
                <Button href={`tel:${siteConfig.phone.e164}`} variant="secondary">
                  {siteConfig.phone.display}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
