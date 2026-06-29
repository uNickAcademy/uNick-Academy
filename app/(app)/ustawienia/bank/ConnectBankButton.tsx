"use client"

import { useState, useEffect } from "react"
import { Landmark, Loader2 } from "lucide-react"

interface Entity {
  id: string
  short_name: string
  name: string
}

interface Institution {
  id: string
  name: string
  bic: string
  logo: string
}

export function ConnectBankButton({ entities }: { entities: Entity[] }) {
  const [entityId, setEntityId] = useState("")
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [institutionId, setInstitutionId] = useState("")
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadingBanks(true)
    fetch("/api/banking/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.error) setError(data.error)
        else setInstitutions(data.institutions ?? [])
      })
      .catch(() => active && setError("Nie udało się pobrać listy banków"))
      .finally(() => active && setLoadingBanks(false))
    return () => { active = false }
  }, [])

  async function handleConnect() {
    if (!entityId || !institutionId) return
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch("/api/banking/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, institutionId }),
      })
      const data = await res.json()
      if (data.link) {
        window.location.href = data.link
      } else {
        setError(data.error ?? "Nie udało się rozpocząć połączenia")
        setConnecting(false)
      }
    } catch {
      setError("Błąd połączenia")
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
        >
          <option value="">Wybierz spółkę</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.short_name}</option>
          ))}
        </select>

        <select
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          disabled={loadingBanks}
          className="px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-50"
        >
          <option value="">{loadingBanks ? "Ładowanie banków..." : "Wybierz bank"}</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-brand-red">{error}</p>}

      <button
        onClick={handleConnect}
        disabled={!entityId || !institutionId || connecting}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
        Podłącz bank
      </button>
    </div>
  )
}
