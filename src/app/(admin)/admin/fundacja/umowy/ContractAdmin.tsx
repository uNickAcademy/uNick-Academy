"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ContractInvitation,
  ParticipantData,
} from "@/lib/foundation/contracts/model";
type Row = {
  id: string;
  created_at: string;
  participant: ParticipantData;
  snapshot: ContractInvitation;
  signed_at: string | null;
  scan_received_at: string | null;
};
type Invitation = {
  id: string;
  participant_label: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  foundation_contract_responses: {
    choice: "yes" | "no";
    note: string;
    created_at: string;
  }[];
};
export default function ContractAdmin({
  declarations,
  groups,
  invitations,
  ready,
  returnEmail,
}: {
  declarations: { id: string; label: string }[];
  groups: { id: string; label: string; firstSupport: string }[];
  invitations: Invitation[];
  ready: boolean;
  returnEmail: string;
}) {
  const router = useRouter(),
    [rows, setRows] = useState<Row[]>([]),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [participantLabel, setParticipantLabel] = useState(""),
    [firstSupport, setFirstSupport] = useState(""),
    [selectedGroups, setSelectedGroups] = useState<string[]>([]),
    [draft, setDraft] = useState("");
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/foundation-contracts", {
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRows(d.submissions);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nie udało się pobrać umów.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setLink("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/foundation-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declarationId: f.get("declarationId"),
          participantLabel: f.get("participantLabel"),
          groupIds: f.getAll("groupIds"),
          firstSupport: f.get("firstSupport"),
          lastSupport: f.get("lastSupport"),
          draft: f.get("draft") === "on",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLink(d.url);
      setDraft(
        `Dzień dobry,\n\n${participantLabel} został(a) wstępnie zakwalifikowany(a) do bezpłatnych zajęć Kreatorzy Przyszłości:\n${groups
          .filter((group) => selectedGroups.includes(group.id))
          .map((group) => group.label)
          .join(
            "\n",
          )}\n\nProsimy o potwierdzenie, czy termin i miejsce nadal odpowiadają, przez indywidualny link:\n${d.url}\n\nJeśli termin pasuje, formularz poprowadzi przez warunki udziału i przygotuje dokumenty PDF. Prosimy je wydrukować, sprawdzić i podpisać, a następnie przesłać czytelny skan na ${returnEmail}. Oryginał dziecko przynosi na pierwsze zajęcia. Osoba pełnoletnia podpisuje dokumenty i dostarcza je samodzielnie.\n\nJeśli termin nie pasuje, prosimy zaznaczyć to w formularzu — skontaktujemy się w sprawie możliwości.\n\nPozdrawiamy,\nuNick Academy Foundation`,
      );
      router.refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Nie udało się utworzyć linku.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, action: "signed" | "scan" | "revoke") {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/api/admin/foundation-contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nie udało się zapisać.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="my-6 flex flex-wrap gap-3">
        <Link
          prefetch={false}
          href="/api/admin/foundation-contracts?format=csv"
          className="rounded-xl bg-teal-800 px-5 py-3 text-white"
        >
          Pobierz kontakty wszystkich uczestników (CSV)
        </Link>
        <button
          onClick={() => void load()}
          className="rounded-xl border px-5 py-3"
        >
          Odśwież
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Plik zawiera dane rodzin, które wypełniły umowę — jeden wiersz z
        najnowszym kontaktem na uczestnika, bez dat urodzenia, PESEL-u i potrzeb
        dostępności.
      </p>
      {message && (
        <p role="alert" className="my-4 rounded-xl bg-amber-50 p-4">
          {message}
        </p>
      )}
      <details className="my-6 rounded-2xl border bg-white p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          Przygotuj indywidualne potwierdzenie
        </summary>
        <form onSubmit={create} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            Zgłoszenie uczestnika
            <select
              name="declarationId"
              onChange={(event) =>
                setParticipantLabel(
                  declarations.find((row) => row.id === event.target.value)
                    ?.label ?? "",
                )
              }
              required
              className="mt-1 w-full rounded-lg border p-3"
            >
              <option value="">Wybierz</option>
              {declarations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Potwierdzone imię i nazwisko uczestnika
            <input
              name="participantLabel"
              value={participantLabel}
              onChange={(event) => setParticipantLabel(event.target.value)}
              required
              maxLength={120}
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
          <label>
            Pierwsza forma wsparcia
            <input
              name="firstSupport"
              type="date"
              value={firstSupport}
              onChange={(event) => setFirstSupport(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
          <label>
            Zakończenie udziału
            <input
              name="lastSupport"
              type="date"
              defaultValue="2027-04-30"
              required
              className="mt-1 w-full rounded-lg border p-3"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="font-semibold">
              Wstępny przydział — sprawdź z aktualną listą w arkuszu
            </legend>
            {groups.map((g) => (
              <label key={g.id} className="my-3 flex gap-3">
                <input
                  type="checkbox"
                  name="groupIds"
                  value={g.id}
                  checked={selectedGroups.includes(g.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedGroups, g.id]
                      : selectedGroups.filter((id) => id !== g.id);
                    setSelectedGroups(next);
                    setFirstSupport(
                      groups
                        .filter((group) => next.includes(group.id))
                        .map((group) => group.firstSupport)
                        .sort()[0] ?? "",
                    );
                  }}
                  className="mt-1 size-5"
                />
                {g.label}
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-gray-600 sm:col-span-2">
            Wybierz pierwsze wsparcie: Kaźmierz 01.12, Tarnowo środa 02.12,
            czwartek 03.12. Creative potrzebują dwóch sal i prowadzących
            równocześnie. Link działa 30 dni. Grupy i daty trafiają do umowy;
            rodzic ich nie zmienia. Skopiuj link po utworzeniu — nie wysyłamy
            wiadomości automatycznie.
          </p>
          {!ready && (
            <p className="sm:col-span-2 text-sm text-amber-900">
              Brakuje danych do ostatecznych umów. Możesz przygotować wyraźnie
              oznaczoną wersję do sprawdzenia.
            </p>
          )}
          <label className="flex gap-3 sm:col-span-2">
            <input type="checkbox" name="draft" defaultChecked={!ready} />
            Przygotuj wersję do sprawdzenia z brakującymi danymi oznaczonymi „do
            uzupełnienia”.
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-teal-800 p-3 text-white disabled:opacity-50"
          >
            {busy ? "Zapisywanie…" : "Utwórz potwierdzenie do wysłania"}
          </button>
        </form>
        {link && (
          <div className="mt-4 rounded-xl bg-green-50 p-4">
            <label>
              Link do przekazania wyłącznie tej rodzinie
              <input
                value={link}
                readOnly
                className="mt-2 w-full rounded-lg border p-3"
                onFocus={(e) => e.currentTarget.select()}
              />
            </label>
            <button
              className="mt-3 underline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setMessage("Link skopiowany.");
                } catch {
                  setMessage("Zaznacz i skopiuj link z pola powyżej.");
                }
              }}
            >
              Kopiuj link
            </button>
            <label className="mt-5 block">
              Gotowa wiadomość do tej rodziny
              <textarea
                readOnly
                value={draft}
                rows={13}
                className="mt-2 w-full rounded-lg border p-3"
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <button
              className="mt-3 underline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(draft);
                  setMessage("Wiadomość skopiowana. Nie została wysłana.");
                } catch {
                  setMessage("Zaznacz i skopiuj wiadomość z pola powyżej.");
                }
              }}
            >
              Kopiuj wiadomość
            </button>
          </div>
        )}
      </details>
      <h2 className="mt-8 text-xl font-semibold">
        Zapisane wersje umów ({rows.length})
      </h2>
      {loading ? (
        <p role="status" className="my-5">
          Wczytywanie umów…
        </p>
      ) : rows.length === 0 ? (
        <p className="my-5 rounded-xl bg-stone-50 p-5">
          Rodzice nie wypełnili jeszcze żadnej umowy.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border bg-white p-5">
              <h3 className="font-bold">
                {row.participant.participantFirstName}{" "}
                {row.participant.participantLastName}
              </h3>
              <p>
                {row.participant.signerFirstName}{" "}
                {row.participant.signerLastName} · {row.participant.email} ·{" "}
                {row.participant.phone}
              </p>
              <p className="mt-1 text-sm">
                {row.snapshot.groups
                  .map((g) => g.title + " — " + g.location)
                  .join(" · ")}
              </p>
              {row.snapshot.documents.draft&&<p className="mt-2 text-amber-900">Wersja do uzupełnienia — przed podpisaniem przygotuj ostateczny pakiet.</p>}
              <p className="mt-2 font-medium">
                {row.signed_at
                  ? "Oryginał otrzymany"
                  : "Oczekujemy papierowego oryginału"}
              </p>
              <p>
                {row.scan_received_at
                  ? "Skan otrzymany"
                  : "Oczekujemy skanu e-mailem"}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link
                  prefetch={false}
                  href={`/api/admin/foundation-contracts/${row.id}`}
                  className="text-teal-800 underline"
                >
                  Pobierz umowę PDF
                </Link>
                {!row.scan_received_at && (
                  <button
                    disabled={busy}
                    className="text-teal-800 underline"
                    onClick={() => void action(row.id, "scan")}
                  >
                    Oznacz odbiór skanu
                  </button>
                )}
                {!row.signed_at && (
                  <button
                    disabled={busy}
                    className="text-teal-800 underline"
                    onClick={() => void action(row.id, "signed")}
                  >
                    Oznacz odbiór oryginału
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <details className="my-8 rounded-xl border p-5">
        <summary className="cursor-pointer">
          Przygotowane linki ({invitations.length})
        </summary>
        {invitations.map((i) => (
          <div
            key={i.id}
            className="my-3 flex flex-wrap justify-between gap-3 border-b py-3"
          >
            <p>
              {i.participant_label} ·{" "}
              {i.foundation_contract_responses?.[0]?.choice === "yes"
                ? "Termin potwierdzony"
                : i.foundation_contract_responses?.[0]?.choice === "no"
                  ? "Termin nie pasuje — kontakt z rodziną"
                  : "Oczekujemy odpowiedzi"}{" "}
              · {i.foundation_contract_responses?.[0]?.note} ·{" "}
              {i.revoked_at
                ? "link wycofany"
                : new Date(i.expires_at) < new Date()
                  ? "link wygasł"
                  : "link aktywny"}
            </p>
            {!i.revoked_at && (
              <button
                disabled={busy}
                onClick={() => void action(i.id, "revoke")}
                className="underline"
              >
                Wycofaj link
              </button>
            )}
          </div>
        ))}
      </details>
    </>
  );
}
