"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Loader2 } from "lucide-react"
import { addEntity } from "../actions"

const inputClass =
  "w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"

export function AddEntityForm({ gusConfigured }: { gusConfigured: boolean }) {
  const [nip, setNip] = useState("")
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [regon, setRegon] = useState("")
  const [krs, setKrs] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [vatPayer, setVatPayer] = useState(false)

  async function handleLookup() {
    setLookupError(null)
    const cleanNip = nip.replace(/[^0-9]/g, "")
    if (cleanNip.length !== 10) {
      setLookupError("NIP musi mieć 10 cyfr")
      return
    }
    setLooking(true)
    try {
      const res = await fetch(`/api/entities/gus-lookup?nip=${cleanNip}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Błąd pobierania danych z GUS")
      setName(data.name ?? "")
      setRegon(data.regon ?? "")
      setStreet(data.address?.street ?? "")
      setCity(data.address?.city ?? "")
      setPostalCode(data.address?.postal_code ?? "")
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Błąd pobierania danych z GUS")
    } finally {
      setLooking(false)
    }
  }

  return (
    <form action={addEntity} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-navy-500 mb-1.5">NIP</label>
        <div className="flex gap-2">
          <input
            name="nip"
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            placeholder="0000000000"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!gusConfigured || looking}
            title={gusConfigured ? "Pobierz dane z GUS" : "Wyszukiwanie GUS nie jest skonfigurowane"}
            className="btn-secondary text-sm shrink-0 disabled:opacity-50 whitespace-nowrap"
          >
            {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Pobierz z GUS
          </button>
        </div>
        {!gusConfigured && (
          <p className="text-xs text-brand-subtle mt-1.5">
            Aby pobierać dane z GUS, dodaj zmienną <code className="bg-brand-muted px-1 rounded">GUS_API_KEY</code>{" "}
            (darmowy klucz na{" "}
            <a href="https://api.stat.gov.pl/Home/RegonApi" target="_blank" rel="noopener noreferrer" className="text-navy-500 underline">
              api.stat.gov.pl
            </a>
            ). Możesz też wpisać dane spółki ręcznie poniżej.
          </p>
        )}
        {lookupError && <p className="text-xs text-brand-red mt-1.5">{lookupError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-500 mb-1.5">
          Pełna nazwa <span className="text-brand-red">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. NOWA SPÓŁKA SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">
            Nazwa skrócona <span className="text-brand-red">*</span>
          </label>
          <input
            name="short_name"
            type="text"
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="np. NOWA"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">Typ podmiotu</label>
          <select name="type" defaultValue="sp_zoo" className={`${inputClass} bg-white`}>
            <option value="sp_zoo">Sp. z o.o.</option>
            <option value="fundacja">Fundacja</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">REGON</label>
          <input
            name="regon"
            type="text"
            value={regon}
            onChange={(e) => setRegon(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">KRS</label>
          <input
            name="krs"
            type="text"
            value={krs}
            onChange={(e) => setKrs(e.target.value)}
            placeholder="opcjonalnie"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-500 mb-1.5">Ulica i numer</label>
        <input
          name="street"
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">Miejscowość</label>
          <input
            name="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-500 mb-1.5">Kod pocztowy</label>
          <input
            name="postal_code"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="00-000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-brand-muted/40 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            id="vat_payer"
            name="vat_payer"
            type="checkbox"
            checked={vatPayer}
            onChange={(e) => setVatPayer(e.target.checked)}
            className="w-4 h-4 rounded border-[#E8EBF0]"
          />
          <label htmlFor="vat_payer" className="text-sm text-navy-500">Płatnik VAT</label>
        </div>
        {vatPayer && (
          <div className="flex items-center gap-1.5">
            <input
              name="vat_rate"
              type="number"
              defaultValue={23}
              min={0}
              max={100}
              step={1}
              className="w-16 px-2 py-1 border border-[#E8EBF0] rounded-md text-sm text-navy-500 text-right"
            />
            <span className="text-sm text-brand-subtle">%</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/ustawienia" className="btn-secondary text-sm">Anuluj</Link>
        <button type="submit" className="btn-primary text-sm">Zapisz spółkę</button>
      </div>
    </form>
  )
}
