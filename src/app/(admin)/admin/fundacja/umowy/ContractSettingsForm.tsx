"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContractSettings } from "@/lib/foundation/contracts/documents";
export default function ContractSettingsForm({
  initial,
}: {
  initial: ContractSettings;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/foundation-contracts/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grantNumber: f.get("grantNumber"),
          lgdNotice: f.get("lgdNotice"),
          retention: f.get("retention"),
          lgdPrivacy: f.get("lgdPrivacy"),
          providerNotice: f.get("providerNotice"),
          returnEmail: f.get("returnEmail"),
          ready: f.get("ready") === "on",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(
        "Zapisano. Nowe linki otrzymają tę wersję danych; wcześniejsze dokumenty zachowają swoją treść.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nie udało się zapisać.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      open={!initial.ready}
      className="my-6 rounded-2xl border bg-white p-5"
    >
      <summary className="cursor-pointer font-semibold">
        Dane projektu — uzupełniamy raz
      </summary>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block">
          Numer grantu z umowy LGD
          <input
            name="grantNumber"
            required
            maxLength={100}
            defaultValue={initial.grantNumber}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="block">
          Adres pełnej informacji RODO LGD (HTTPS)
          <input
            type="url"
            name="lgdNotice"
            required
            defaultValue={initial.lgdNotice}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="block">
          Okres archiwizacji i sposób liczenia, zgodnie z podpisaną umową
          <textarea
            name="retention"
            required
            minLength={20}
            maxLength={4000}
            rows={3}
            defaultValue={initial.retention}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="block">
          Pełna treść informacji RODO LGD do dołączenia do PDF
          <textarea
            name="lgdPrivacy"
            required
            minLength={50}
            maxLength={20000}
            rows={6}
            defaultValue={initial.lgdPrivacy}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="block">
          Uzupełnienie informacji Fundacji: faktyczni dostawcy strony i bazy,
          przekazywanie danych poza EOG i zabezpieczenia
          <textarea
            name="providerNotice"
            required
            minLength={20}
            maxLength={5000}
            rows={4}
            defaultValue={initial.providerNotice}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="block">
          Adres do otrzymywania skanów
          <input
            type="email"
            name="returnEmail"
            required
            defaultValue={initial.returnEmail}
            className="mt-1 w-full rounded-lg border p-3"
          />
        </label>
        <label className="flex gap-3">
          <input
            name="ready"
            type="checkbox"
            defaultChecked={initial.ready}
            className="mt-1 size-5"
          />
          Dane projektu i treść umowy są gotowe do przekazania rodzicom.
        </label>
        <button
          disabled={busy}
          className="rounded-xl bg-teal-800 px-5 py-3 text-white disabled:opacity-50"
        >
          {busy ? "Zapisywanie…" : "Zapisz dane projektu"}
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
