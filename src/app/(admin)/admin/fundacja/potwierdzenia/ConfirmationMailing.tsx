"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
type Row = {
  id: string;
  participant_label: string;
  to_email: string;
  status: "queued" | "sending" | "sent" | "error";
  sender: string;
  sent_at: string | null;
  last_error: string | null;
  scheduleChoice: "yes" | "no" | null;
  scheduleNote: string;
};
const labels = {
  queued: "Oczekuje",
  sending: "Wysyłanie",
  sent: "Wysłano",
  error: "Do sprawdzenia",
};
export default function ConfirmationMailing() {
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [detailsCount, setDetailsCount] = useState(0),
    [sender, setSender] = useState(""),
    [message, setMessage] = useState("");
  const running = useRef(false),
    cancel = useRef(false);
  async function load() {
    const response = await fetch("/api/admin/foundation-confirmations", {
        cache: "no-store",
      }),
      data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setRows(data.rows);
    setDetailsCount(data.detailsCount);
    setSender(data.sender);
    return data.rows as Row[];
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/foundation-confirmations", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        if (active) {
          setRows(data.rows);
          setDetailsCount(data.detailsCount);
          setSender(data.sender);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function send(all: boolean) {
    if (running.current) return;
    running.current = true;
    cancel.current = false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const pending = (await load()).filter((row) => row.status === "queued");
      const selection = all ? pending : pending.slice(0, 1);
      for (const [index, row] of selection.entries()) {
        if (cancel.current) break;
        setMessage(
          `Wysyłanie: ${row.participant_label} (${index + 1}/${selection.length})`,
        );
        const response = await fetch("/api/admin/foundation-confirmations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: row.id }),
          }),
          data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await load();
      }
      setMessage(
        selection.length
          ? "Zakończono wybraną wysyłkę."
          : "Brak oczekujących wiadomości.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Wysyłka została zatrzymana. Sprawdź rejestr.",
      );
      await load().catch(() => {});
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  const sent = rows.filter((row) => row.status === "sent").length,
    pending = rows.filter((row) => row.status === "queued").length;
  return (
    <section className="mt-7 space-y-6">
      <div className="rounded-xl bg-teal-50 p-5">
        <strong>Nadawca: {sender || "hello@unick-academy.pl"}</strong>
        <p className="mt-2">
          Formularz zbiera dane do przygotowania umowy. Bez zgód, akceptacji
          umowy i generowania PDF.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Uczestników", rows.length],
          ["Wysłano", sent],
          ["Oczekuje", pending],
          ["Zapisane dane rodzin", detailsCount],
          [
            "Terminy potwierdzone",
            rows.filter((row) => row.scheduleChoice === "yes").length,
          ],
          [
            "Prośby o kontakt",
            rows.filter((row) => row.scheduleChoice === "no").length,
          ],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl border p-4">
            <p className="text-sm text-stone-600">{label}</p>
            <strong className="text-2xl">{count}</strong>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {busy && (
        <button
          className="rounded-xl border px-5 py-3"
          onClick={() => {
            cancel.current = true;
            setMessage("Zatrzymamy wysyłkę po bieżącej wiadomości.");
          }}
        >
          Zatrzymaj wysyłkę po bieżącej wiadomości
        </button>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy || loading || !pending}
          onClick={() => void send(false)}
          className="rounded-xl border px-5 py-3 disabled:opacity-50"
        >
          Wyślij pierwszą oczekującą wiadomość
        </button>
        <button
          disabled={busy || loading || !pending}
          onClick={() => void send(true)}
          className="rounded-xl bg-teal-800 px-5 py-3 text-white disabled:opacity-50"
        >
          {busy ? "Trwa wysyłka…" : "Wyślij wszystkie oczekujące wiadomości"}
        </button>
        <button
          disabled={busy}
          onClick={() => void load().catch((e) => setError(e.message))}
          className="rounded-xl border px-5 py-3"
        >
          Odśwież status
        </button>
        <Link
          prefetch={false}
          href="/api/admin/foundation-confirmations?format=csv"
          className="rounded-xl border px-5 py-3"
        >
          Pobierz dane do umów (CSV)
        </Link>
      </div>
      <p className="text-sm text-stone-600">
        Wiadomości idą osobno, bez listy innych adresatów. Nie zamykaj tej
        strony podczas wysyłki. Po przerwaniu ponowne uruchomienie obejmuje
        wyłącznie oczekujące wiadomości. Błędy i wysyłki o niepewnym wyniku
        wymagają sprawdzenia.
      </p>
      {loading ? (
        <p role="status">Wczytywanie listy…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {[
                  "Uczestnik",
                  "Adres rodzica / uczestnika",
                  "Status",
                  "Nadawca",
                  "Potwierdzenie terminu",
                ].map((label) => (
                  <th key={label} className="border-b p-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-b p-3">{row.participant_label}</td>
                  <td className="border-b p-3">{row.to_email}</td>
                  <td className="border-b p-3">
                    {labels[row.status]}
                    {row.last_error && (
                      <p className="mt-1 text-sm text-red-800">
                        {row.last_error}
                      </p>
                    )}
                  </td>
                  <td className="border-b p-3">{row.sender}</td>
                  <td className="border-b p-3">
                    <span
                      className={
                        row.scheduleChoice === "no"
                          ? "font-semibold text-amber-900"
                          : undefined
                      }
                    >
                      {row.scheduleChoice === "yes"
                        ? "Termin potwierdzony"
                        : row.scheduleChoice === "no"
                          ? "Termin nie odpowiada — prośba o kontakt"
                          : "Oczekujemy odpowiedzi"}
                    </span>
                    {row.scheduleNote && (
                      <p className="mt-2 max-w-sm whitespace-pre-wrap break-words text-sm">
                        {row.scheduleNote}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
