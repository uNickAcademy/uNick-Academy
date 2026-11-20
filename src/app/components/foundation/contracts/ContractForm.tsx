"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  municipalityOptions,
  calculateAgeOnDate,
} from "@/lib/foundation/options";
import type {
  ContractDocuments,
  ContractGroup,
} from "@/lib/foundation/contracts/model";
import styles from "./ContractForm.module.css";
type Context = {
  groups: ContractGroup[];
  firstSupport: string;
  lastSupport: string;
  documents: ContractDocuments;
  submitted: boolean;
  choice?: "yes" | "no" | null;
};
export default function ContractForm({ preview }: { preview?: Context } = {}) {
  const [context, setContext] = useState<Context | null>(preview ?? null),
    [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(!preview),
    [birth, setBirth] = useState(""),
    [submitted, setSubmitted] = useState(false),
    [choice, setChoice] = useState<"yes" | "no" | null>(
      preview?.choice ?? null,
    );
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (preview) return;
    let active = true;
    async function initialize() {
      const secret =
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      if (!secret)
        throw new Error(
          "Otwórz indywidualny link otrzymany od Fundacji. Ten formularz jest dla osób wstępnie zakwalifikowanych.",
        );
      const response = await fetch("/api/foundation-contract/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: secret }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) {
        setToken(secret);
        setContext(data);
        setSubmitted(data.submitted);
        setChoice(data.choice);
      }
    }
    initialize()
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Nie udało się otworzyć formularza.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preview]);
  const age = birth
    ? calculateAgeOnDate(
        birth,
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/Warsaw",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()),
      )
    : null;
  const adult = age !== null && age >= 18;
  async function getPdf(data: unknown, path: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        cache: "no-store",
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error);
      }
      const blob = await r.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "Umowa-Kreatorzy-Przyszlosci.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setSubmitted(true);
      setBirth("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Nie udało się pobrać umowy. Spróbuj ponownie.",
      );
      setTimeout(() => alert.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) {
      setChoice(
        new FormData(event.currentTarget).get("choice") as "yes" | "no",
      );
      return;
    }
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/foundation-contract/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          choice: fields.get("choice"),
          note: fields.get("note") || "",
        }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setChoice(result.choice);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Nie udało się zapisać odpowiedzi.",
      );
      setTimeout(() => alert.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview) {
      setError("To podgląd formularza. Dane nie zostały wysłane.");
      return;
    }
    const f = new FormData(e.currentTarget),
      data: Record<string, unknown> = Object.fromEntries(f);
    data.token = token;
    data.birthDate = birth;
    for (const key of [
      "accessibilityContact",
      "participationAccepted",
      "residenceConfirmed",
      "privacyAcknowledged",
      "authorityConfirmed",
    ])
      data[key] = f.get(key) === "on";
    if (adult) {
      data.signerType = "adult";
      data.signerFirstName = data.participantFirstName;
      data.signerLastName = data.participantLastName;
    }
    await getPdf(data, "/api/foundation-contract/submit");
  }
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {/* Dedicated route has no marketing analytics or third-party form integrations. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.funding}
          src="/foundation/contracts/belka.png"
          alt="Fundusze Europejskie dla Wielkopolski, Rzeczpospolita Polska, Unia Europejska, Samorząd Województwa Wielkopolskiego"
        />
        <p className={styles.eyebrow}>UNICK ACADEMY FOUNDATION</p>
        <h1>Potwierdźmy Twoje zajęcia.</h1>
        {preview && (
          <p className={styles.error}>
            PODGLĄD NA DANYCH FIKCYJNYCH — bez zapisu i wysyłki.
          </p>
        )}
        <p>
          Miejsce zostało wstępnie przyznane. Sprawdź termin i lokalizację.
          Jeśli pasują, uzupełnij dane i pobierz dokumenty do podpisu.
        </p>
        <p
          ref={alert}
          tabIndex={-1}
          role="alert"
          className={error ? styles.error : undefined}
        >
          {error}
        </p>
        {context?.documents.draft && (
          <p role="status" className={styles.error}>
            Wersja do sprawdzenia. Numer umowy grantowej i brakujące informacje
            projektu uzupełnimy przed ostatecznym podpisaniem dokumentów. Teraz
            możesz potwierdzić termin, przejść formularz i pobrać projekt umowy.
          </p>
        )}
        {loading && <p role="status">Przygotowujemy formularz…</p>}
        {context && (
          <>
            <section className={styles.assignment}>
              <h2>Proponowane zajęcia</h2>
              {context.groups.map((g) => (
                <div key={g.id}>
                  <strong>
                    {g.title} · {g.location}
                  </strong>
                  <p>{g.schedule}</p>
                </div>
              ))}
              <p>
                Okres udziału: {context.firstSupport} – {context.lastSupport}
              </p>
            </section>
            {!choice && !submitted && (
              <form onSubmit={respond}>
                <fieldset>
                  <legend>Czy termin i miejsce nadal odpowiadają?</legend>
                  <label className={styles.check}>
                    <input type="radio" name="choice" value="yes" required />
                    Tak, potwierdzam wszystkie wskazane zajęcia.
                  </label>
                  <label className={styles.check}>
                    <input type="radio" name="choice" value="no" required />
                    Nie, potrzebuję kontaktu w sprawie terminu lub rezygnuję.
                  </label>
                  <label className={styles.note}>
                    Wiadomość do Fundacji (opcjonalnie)
                    <textarea
                      name="note"
                      maxLength={1500}
                      rows={3}
                      placeholder="Np. który termin nie pasuje. Nie podawaj danych o zdrowiu."
                    />
                  </label>
                  <p className={styles.hint}>
                    Odpowiedź dotyczy wstępnego przydziału. Nie musisz
                    podpisywać umowy, jeśli termin nie odpowiada.
                  </p>
                </fieldset>
                <button disabled={busy} type="submit">
                  {busy ? "Zapisywanie…" : "Zapisz odpowiedź"}
                </button>
              </form>
            )}
            {choice === "no" && (
              <section className={styles.success} role="status">
                <h2>Dziękujemy za odpowiedź.</h2>
                <p>
                  Fundacja sprawdzi możliwości i skontaktuje się z Tobą. Na tym
                  etapie nie podpisujesz umowy. Zmiana grupy wymaga uzgodnienia
                  z Fundacją.
                </p>
              </section>
            )}
            {submitted ? (
              <section className={styles.success}>
                <h2>
                  {context.documents.draft
                    ? "Dane zapisane. Projekt umowy jest gotowy."
                    : "Dane zapisane. Umowa jest gotowa."}
                </h2>
                {context.documents.draft && (
                  <p>
                    To wersja do sprawdzenia. Poczekaj z podpisywaniem na
                    uzupełniony pakiet od Fundacji.
                  </p>
                )}
                <p>
                  {context.documents.draft ? "Po otrzymaniu ostatecznej wersji: " : ""}Wydrukuj cały pakiet, sprawdź dane i podpisz dokumenty we
                  wskazanych miejscach. Formularz nie zastępuje podpisu. W
                  formularzu LGD zaznacz potrzeby dostępności albo „Nie
                  dotyczy”.
                </p>
                <ol>
                  <li>Podpisz umowę i formularz rekrutacyjny LGD.</li>
                  <li>
                    Wyślij czytelny skan wszystkich podpisanych stron na{" "}
                    <a
                      href={`mailto:${context.documents.returnEmail || context.documents.contact}?subject=${encodeURIComponent("Kreatorzy Przyszłości — podpisane dokumenty")}`}
                    >
                      {context.documents.returnEmail ||
                        context.documents.contact}
                    </a>
                    .
                  </li>
                  <li>
                    Oryginał dziecko przynosi na pierwsze zajęcia. Osoba
                    pełnoletnia dostarcza go samodzielnie.
                  </li>
                </ol>
                <p>
                  Fundacja sprawdzi dokumenty i potwierdzi ich odbiór. Zachowaj
                  kopię dla siebie.
                </p>
                <button
                  disabled={busy}
                  onClick={() =>
                    void getPdf({ token }, "/api/foundation-contract/download")
                  }
                >
                  {busy ? "Pobieranie…" : "Pobierz umowę ponownie"}
                </button>
                <p>
                  Jeśli potrzebujesz poprawki, skontaktuj się z Fundacją.
                  Poprzedni dokument pozostanie w historii.
                </p>
              </section>
            ) : choice === "yes" ? (
              <form onSubmit={submit}>
                <fieldset>
                  <legend>1. Uczestnik</legend>
                  <div className={styles.grid}>
                    <label>
                      Imię uczestnika *
                      <input
                        name="participantFirstName"
                        autoComplete="off"
                        required
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Nazwisko uczestnika *
                      <input
                        name="participantLastName"
                        autoComplete="off"
                        required
                        maxLength={100}
                      />
                    </label>
                    <label>
                      Data urodzenia *
                      <input
                        type="date"
                        name="birthDate"
                        value={birth}
                        onChange={(e) => setBirth(e.target.value)}
                        required
                        aria-describedby="birth-help"
                      />
                    </label>
                    <label>
                      Płeć — pole formularza LGD *
                      <select name="sex" required defaultValue="">
                        <option value="">Wybierz</option>
                        <option value="K">Kobieta</option>
                        <option value="M">Mężczyzna</option>
                      </select>
                    </label>
                    <label>
                      Gmina zamieszkania *
                      <select name="municipality" required defaultValue="">
                        <option value="">Wybierz</option>
                        {municipalityOptions.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Miejscowość zamieszkania *
                      <input
                        name="town"
                        required
                        maxLength={120}
                        autoComplete="address-level2"
                      />
                    </label>
                  </div>
                  <p id="birth-help" className={styles.hint}>
                    Datę urodzenia wykorzystamy tylko do obliczenia wieku; nie
                    zapiszemy jej z umową. Nie podawaj PESEL-u, numeru dowodu
                    ani dokładnego adresu.
                  </p>
                  <label className={styles.check}>
                    <input type="checkbox" name="residenceConfirmed" required />
                    Potwierdzam prawdziwość danych i zamieszkanie uczestnika we
                    wskazanej gminie. *
                  </label>
                </fieldset>
                <fieldset>
                  <legend>
                    2.{" "}
                    {adult
                      ? "Kontakt do uczestnika"
                      : "Rodzic lub opiekun prawny"}
                  </legend>
                  {!adult && (
                    <div className={styles.grid}>
                      <label>
                        Imię osoby podpisującej *
                        <input
                          name="signerFirstName"
                          required
                          maxLength={100}
                          autoComplete="given-name"
                        />
                      </label>
                      <label>
                        Nazwisko osoby podpisującej *
                        <input
                          name="signerLastName"
                          required
                          maxLength={100}
                          autoComplete="family-name"
                        />
                      </label>
                      <label>
                        Podpisuję jako *
                        <select name="signerType" defaultValue="parent">
                          <option value="parent">Rodzic</option>
                          <option value="guardian">Opiekun prawny</option>
                        </select>
                      </label>
                    </div>
                  )}
                  {adult && (
                    <p>
                      Jako osoba pełnoletnia podpiszesz umowę samodzielnie.
                      Użyjemy imienia i nazwiska z części powyżej.
                    </p>
                  )}
                  <div className={styles.grid}>
                    <label>
                      E-mail *
                      <input
                        type="email"
                        name="email"
                        required
                        maxLength={180}
                        autoComplete="email"
                      />
                    </label>
                    <label>
                      Telefon *
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={30}
                        autoComplete="tel"
                      />
                    </label>
                  </div>
                  <label className={styles.check}>
                    <input type="checkbox" name="authorityConfirmed" required />
                    {adult
                      ? "Potwierdzam, że podpisuję we własnym imieniu."
                      : "Potwierdzam uprawnienie do reprezentowania dziecka i podpisania umowy."}{" "}
                    *
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" name="accessibilityContact" />
                    Proszę o kontakt w sprawie dostępności zajęć. Nie podaję
                    diagnozy w tym formularzu.
                  </label>
                </fieldset>
                <fieldset>
                  <legend>3. Umowa i potwierdzenia</legend>
                  <details>
                    <summary>Przeczytaj warunki umowy</summary>
                    {context.documents.terms.map((p, i) => (
                      <p key={i}>
                        {i + 1}. {p}
                      </p>
                    ))}
                  </details>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      name="participationAccepted"
                      required
                    />
                    Zapoznałem/am się z warunkami umowy i akceptuję bezpłatny
                    udział w przypisanych zajęciach. *
                  </label>
                  <details>
                    <summary>Informacje o przetwarzaniu danych</summary>
                    {context.documents.privacy.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    <p>{context.documents.lgdPrivacy}</p>
                    <p>
                      <a
                        href={context.documents.lgdNotice}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {context.documents.draft
                          ? "Dokumenty LGD — informacje projektowe do uzupełnienia"
                          : "Pełna informacja LGD"}
                      </a>
                    </p>
                    <p>
                      <a
                        href={context.documents.regionalNotice}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Informacja Województwa Wielkopolskiego
                      </a>
                    </p>
                  </details>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      name="privacyAcknowledged"
                      required
                    />
                    Zapoznałem/am się z informacjami administratorów o
                    przetwarzaniu danych na potrzeby umowy i projektu. *
                  </label>
                  <p className={styles.hint}>
                    Nie prosimy o zgody marketingowe. Umowa nie obejmuje
                    publikacji wizerunku, głosu ani prac uczestnika.
                  </p>
                </fieldset>
                <button disabled={busy || Boolean(preview)} type="submit">
                  {busy
                    ? "Zapisujemy dane i przygotowujemy umowę…"
                    : "Zapisz dane i pobierz dokumenty PDF"}
                </button>
                <p className={styles.hint}>
                  Dane zapiszą się w Fundacji. Otrzymasz PDF z miejscami na
                  podpisy. Podpisany skan prześlesz mailem, a oryginał
                  dostarczysz na pierwsze zajęcia.
                </p>
              </form>
            ) : null}
            <p className={styles.contact}>
              Potrzebujesz pomocy?{" "}
              <a href={`mailto:${context.documents.contact}`}>
                {context.documents.contact}
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
