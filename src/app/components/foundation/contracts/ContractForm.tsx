"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  municipalityOptions,
  calculateAgeOnDate,
} from "@/lib/foundation/options";
import type { ContractGroup } from "@/lib/foundation/contracts/model";
import styles from "./ContractForm.module.css";
type Context = {
  groups: ContractGroup[];
  firstSupport: string;
  lastSupport: string;
  documents: { contact: string };
  submitted: boolean;
  choice?: "yes" | "no" | null;
  note?: string;
};
export default function ContractForm({ preview }: { preview?: Context } = {}) {
  const [context, setContext] = useState<Context | null>(preview ?? null),
    [token, setToken] = useState(""),
    [choice, setChoice] = useState<"yes" | "no" | null>(
      preview?.choice ?? null,
    ),
    [editingChoice, setEditingChoice] = useState(false),
    [note, setNote] = useState(preview?.note ?? ""),
    [birth, setBirth] = useState(""),
    [submitted, setSubmitted] = useState(preview?.submitted ?? false),
    [loading, setLoading] = useState(!preview),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (preview) return;
    let active = true;
    async function initialize() {
      const secret =
        new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
      if (!secret)
        throw new Error("Otwórz indywidualny link otrzymany od Fundacji.");
      const response = await fetch("/api/foundation-contract/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: secret }),
          cache: "no-store",
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) {
        setToken(secret);
        setContext(data);
        setChoice(data.choice);
        setNote(data.note ?? "");
        setSubmitted(data.submitted);
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
  async function post(path: string, payload: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Nie udało się zapisać danych. Spróbuj ponownie.",
      );
      setTimeout(() => alert.current?.focus(), 0);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (preview) {
      setChoice(fields.get("choice") as "yes" | "no");
      setNote(String(fields.get("note") ?? ""));
      setEditingChoice(false);
      return;
    }
    const data = await post("/api/foundation-contract/respond", {
      token,
      choice: fields.get("choice"),
      note: fields.get("note") || "",
    });
    if (data) {
      setChoice(data.choice);
      setNote(data.note ?? "");
      setEditingChoice(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview) {
      setError("To podgląd. Dane nie zostały wysłane.");
      return;
    }
    const fields = new FormData(event.currentTarget),
      data: Record<string, unknown> = Object.fromEntries(fields);
    data.token = token;
    data.birthDate = birth;
    if (adult) {
      data.contactRole = "adult";
      data.contactFirstName = data.participantFirstName;
      data.contactLastName = data.participantLastName;
    }
    if (await post("/api/foundation-contract/submit", data)) {
      setSubmitted(true);
      setBirth("");
    }
  }
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.funding}
          src="/foundation/contracts/belka.png"
          alt="Fundusze Europejskie dla Wielkopolski, Rzeczpospolita Polska, Unia Europejska, Samorząd Województwa Wielkopolskiego"
        />
        <p className={styles.eyebrow}>uNick Academy Foundation</p>
        <h1>Potwierdźmy Twoje zajęcia.</h1>
        <p>
          Udział w programie jest bezpłatny. Sprawdź termin i miejsce zajęć.
          Jeśli odpowiadają, potwierdź uczestnictwo i uzupełnij dane.
        </p>
        <p
          ref={alert}
          tabIndex={-1}
          role="alert"
          className={error ? styles.error : undefined}
        >
          {error}
        </p>
        {loading && <p role="status">Przygotowujemy formularz…</p>}
        {context && (
          <>
            <section className={styles.assignment}>
              <h2>Twoje zajęcia</h2>
              {context.groups.map((group) => (
                <div key={group.id}>
                  <strong>
                    {group.title} · {group.location}
                  </strong>
                  <p>{group.schedule}</p>
                </div>
              ))}
              <p>
                Pierwsze spotkanie:{" "}
                {new Intl.DateTimeFormat("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/Warsaw",
                }).format(new Date(context.firstSupport + "T12:00:00Z"))}
              </p>
            </section>
            {choice && !editingChoice && (
              <button
                type="button"
                className={styles.changeResponse}
                disabled={busy}
                onClick={() => setEditingChoice(true)}
              >
                Zmień odpowiedź dotyczącą terminu
              </button>
            )}
            {(!choice || editingChoice) && (
              <form onSubmit={respond}>
                <fieldset>
                  <legend>Czy termin i miejsce nadal odpowiadają?</legend>
                  <label className={styles.check}>
                    <input
                      type="radio"
                      name="choice"
                      value="yes"
                      defaultChecked={choice === "yes"}
                      required
                    />
                    Tak, potwierdzam uczestnictwo.
                  </label>
                  <label className={styles.check}>
                    <input
                      type="radio"
                      name="choice"
                      value="no"
                      defaultChecked={choice === "no"}
                      required
                    />
                    Nie, termin mi nie odpowiada — proszę o kontakt.
                  </label>
                  <label className={styles.note}>
                    Jakie dni lub godziny pasują? Wiadomość do Fundacji
                    (opcjonalnie)
                    <textarea
                      name="note"
                      defaultValue={note}
                      maxLength={1500}
                      rows={3}
                      placeholder="Np. odpowiada mi wtorek po 17:00. Możesz też zgłosić rezygnację."
                    />
                  </label>
                </fieldset>
                <button type="submit" disabled={busy}>
                  {busy ? "Zapisywanie…" : "Zapisz odpowiedź"}
                </button>
                {choice && (
                  <button
                    type="button"
                    className={styles.changeResponse}
                    disabled={busy}
                    onClick={() => setEditingChoice(false)}
                  >
                    Anuluj zmianę
                  </button>
                )}
              </form>
            )}
            {choice === "no" && (
              <section className={styles.success} role="status">
                <h2>Dziękujemy za odpowiedź.</h2>
                <p>
                  Zapisaliśmy informację, że termin nie odpowiada. Skontaktujemy
                  się, aby omówić dostępne możliwości. Nie musisz teraz
                  wypełniać danych uczestnika i rodzica.
                </p>
                {note && <p>Twoja wiadomość: {note}</p>}
              </section>
            )}
            {choice === "yes" &&
              (submitted ? (
                <section className={styles.success} role="status">
                  <h2>Dziękujemy. Dane zostały zapisane.</h2>
                  <p>Na podstawie tych danych zostanie sporządzona umowa.</p>
                </section>
              ) : (
                <form onSubmit={submit}>
                  <fieldset>
                    <legend>Dane uczestnika</legend>
                    <div className={styles.grid}>
                      <label>
                        Imię uczestnika *
                        <input
                          name="participantFirstName"
                          required
                          maxLength={100}
                          autoComplete="off"
                        />
                      </label>
                      <label>
                        Nazwisko uczestnika *
                        <input
                          name="participantLastName"
                          required
                          maxLength={100}
                          autoComplete="off"
                        />
                      </label>
                      <label>
                        Data urodzenia *
                        <input
                          name="birthDate"
                          type="date"
                          value={birth}
                          onChange={(event) => setBirth(event.target.value)}
                          required
                          aria-describedby="birth-help"
                        />
                      </label>
                      <label>
                        Gmina zamieszkania *
                        <select name="municipality" required defaultValue="">
                          <option value="">Wybierz</option>
                          {municipalityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className={styles.note}>
                      Adres zamieszkania *
                      <textarea
                        name="address"
                        autoComplete="street-address"
                        required
                        minLength={8}
                        maxLength={500}
                        rows={3}
                        placeholder="Ulica, numer domu i mieszkania, kod pocztowy, miejscowość"
                      />
                    </label>
                    <p id="birth-help" className={styles.hint}>
                      Data urodzenia służy do obliczenia wieku uczestnika. Nie
                      podawaj numeru PESEL ani numeru dokumentu tożsamości.
                    </p>
                  </fieldset>
                  <fieldset>
                    <legend>
                      {adult
                        ? "Dane kontaktowe uczestnika"
                        : "Dane rodzica lub opiekuna"}
                    </legend>
                    {!adult && (
                      <div className={styles.grid}>
                        <label>
                          Imię rodzica lub opiekuna *
                          <input
                            name="contactFirstName"
                            required
                            maxLength={100}
                            autoComplete="given-name"
                          />
                        </label>
                        <label>
                          Nazwisko rodzica lub opiekuna *
                          <input
                            name="contactLastName"
                            required
                            maxLength={100}
                            autoComplete="family-name"
                          />
                        </label>
                        <label>
                          Relacja z uczestnikiem *
                          <select name="contactRole" defaultValue="parent">
                            <option value="parent">Rodzic</option>
                            <option value="guardian">Opiekun prawny</option>
                          </select>
                        </label>
                      </div>
                    )}
                    {adult && (
                      <p>
                        Jako osoba pełnoletnia podaj własne dane kontaktowe.
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
                  </fieldset>
                  <button type="submit" disabled={busy}>
                    {busy
                      ? "Zapisujemy dane…"
                      : "Zapisz dane i potwierdź uczestnictwo"}
                  </button>
                  <p className={styles.hint}>
                    Na podstawie tych danych zostanie sporządzona umowa.
                  </p>
                </form>
              ))}
            <p className={styles.contact}>
              Potrzebujesz pomocy?{" "}
              <a href={`mailto:${context.documents.contact}`}>
                {context.documents.contact}
              </a>
            </p>
          </>
        )}
        <p className={styles.contact}>
          <a
            href="/uczestnictwo/dane-osobowe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Informacja o przetwarzaniu danych osobowych
          </a>
        </p>
      </div>
    </main>
  );
}
