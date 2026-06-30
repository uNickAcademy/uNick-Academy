"use client"

import { useState } from "react"
import { Check, X, Link2, RotateCcw } from "lucide-react"
import { formatPLN, formatDate } from "@/lib/ufos/formatters"
import { matchTransaction, ignoreTransaction, unmatchTransaction } from "./actions"

export interface Debtor {
  id: string
  student_name: string
  credit_balance: number
}

export interface TxRow {
  id: string
  booking_date: string
  amount: number
  counterparty_name: string | null
  description: string | null
  match_status: string
  matched_student_id: string | null
  matched_note: string | null
}

/** Suggest a debtor whose name appears in the transaction text. */
function suggestDebtor(tx: TxRow, debtors: Debtor[]): Debtor | null {
  const hay = `${tx.counterparty_name ?? ""} ${tx.description ?? ""}`.toLowerCase()
  if (!hay.trim()) return null
  for (const d of debtors) {
    const parts = d.student_name.toLowerCase().split(/\s+/).filter((p) => p.length > 2)
    if (parts.length && parts.every((p) => hay.includes(p))) return d
  }
  return null
}

export function MatchRow({ tx, debtors }: { tx: TxRow; debtors: Debtor[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>("")
  const [note, setNote] = useState("")
  const [pending, setPending] = useState(false)

  const suggestion = suggestDebtor(tx, debtors)
  const matchedDebtor = debtors.find((d) => d.id === tx.matched_student_id)

  async function handleMatch(studentId: string | null, noteText: string | null) {
    setPending(true)
    await matchTransaction(tx.id, studentId, noteText)
    setPending(false)
    setOpen(false)
  }

  if (tx.match_status === "matched") {
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-brand-green/5 border border-brand-green/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-green/15 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-brand-green" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-navy-500 truncate">
              {formatPLN(tx.amount)} · {tx.counterparty_name ?? "—"}
            </p>
            <p className="text-xs text-brand-subtle truncate">
              {matchedDebtor ? `Dopasowano: ${matchedDebtor.student_name}` : tx.matched_note ?? "Dopasowano"}
              {" · "}{formatDate(tx.booking_date)}
            </p>
          </div>
        </div>
        <button
          onClick={() => unmatchTransaction(tx.id)}
          className="text-xs text-brand-subtle hover:text-navy-500 flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="w-3 h-3" /> Cofnij
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#E8EBF0] hover:border-navy-200 transition-colors">
      <div className="flex items-center justify-between py-3 px-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-500 truncate">
            {formatPLN(tx.amount)}
            <span className="font-normal text-brand-subtle"> · {tx.counterparty_name ?? "nieznany nadawca"}</span>
          </p>
          <p className="text-xs text-brand-subtle truncate">
            {formatDate(tx.booking_date)}
            {tx.description ? ` · ${tx.description}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {suggestion && !open && (
            <button
              onClick={() => handleMatch(suggestion.id, null)}
              disabled={pending}
              className="text-xs px-2.5 py-1.5 rounded-md bg-brand-green/10 text-brand-green font-medium hover:bg-brand-green/20 flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {suggestion.student_name}
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-[#E8EBF0] text-navy-500 hover:bg-brand-muted/60 flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> Dopasuj
          </button>
          <button
            onClick={() => ignoreTransaction(tx.id)}
            className="text-xs px-2 py-1.5 rounded-md text-brand-subtle hover:text-brand-red hover:bg-red-50"
            title="Ignoruj"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[#E8EBF0] space-y-3">
          <div>
            <label className="block text-xs font-medium text-navy-500 mb-1">Powiąż z uczniem</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
            >
              <option value="">— wybierz ucznia z zaległością —</option>
              {debtors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.student_name} ({formatPLN(d.credit_balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-500 mb-1">Lub notatka (np. zwrot, inna wpłata)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="opcjonalna notatka"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md text-brand-subtle hover:text-navy-500">
              Anuluj
            </button>
            <button
              onClick={() => handleMatch(selected || null, note || null)}
              disabled={pending || (!selected && !note)}
              className="text-xs px-3 py-1.5 rounded-md bg-navy-500 text-white font-medium hover:bg-navy-600 disabled:opacity-50"
            >
              Zatwierdź dopasowanie
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
