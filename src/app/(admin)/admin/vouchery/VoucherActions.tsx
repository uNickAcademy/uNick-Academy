'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function VoucherActions({ orderId, active, admin, emailSent, reservation }: { orderId: string; active: boolean; admin: boolean; emailSent: boolean; reservation: 'free' | 'mine' | 'other' }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  async function send(payload: object) {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/vouchers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, orderId }) })
      const result = await response.json()
      if (!response.ok) { setMessage(result.error || 'Nie zapisano zmiany.'); return }
      setMessage('Zapisano.'); router.refresh()
    } catch { setMessage('Połączenie nie powiodło się. Spróbuj ponownie.') }
    finally { setBusy(false) }
  }
  return <div className="space-y-3 text-sm">
    {!emailSent && <button disabled={busy} className="underline" onClick={() => send({ action: 'retry-email' })}>Ponów dostarczenie vouchera</button>}
    {!active && reservation === 'free' && <button className="rounded bg-[#C0392B] text-white px-4 py-2" disabled={busy} onClick={() => send({ action: 'reserve', release: false, confirmed: true })}>Zarezerwuj aktywację dla mnie</button>}
    {!active && reservation === 'other' && <p>Inna osoba z obsługi zarezerwowała tę aktywację. Nie zmieniaj salda w ActiveNow.</p>}
    {!active && reservation === 'mine' && <details open><summary className="cursor-pointer font-medium">Twoja rezerwacja — potwierdź aktywację w ActiveNow</summary>
      <p className="my-3">Ten przycisk zapisuje rejestr. Nie zmienia salda w ActiveNow. Najpierw zweryfikuj odbiorcę i sposób ewidencji wpłaty oraz zniżki, wykonaj uzgodnione operacje w ActiveNow i wpisz ich referencje.</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); send({ action: 'activation', clientId: form.get('clientId'), reference: form.get('reference'), confirmed: form.get('confirmed') === 'on' }) }}>
        <label className="block">ID odbiorcy w ActiveNow<input className="block w-full border rounded p-2" name="clientId" inputMode="numeric" pattern="[0-9]{1,16}" required /></label>
        <label className="block">Referencje obu operacji<input className="block w-full border rounded p-2" name="reference" minLength={3} maxLength={500} required /></label>
        <label className="flex gap-2"><input name="confirmed" type="checkbox" required />Sprawdziłam opłacenie, odbiorcę i zapisałam wartość tylko raz w ActiveNow.</label>
        <button className="rounded bg-[#C0392B] text-white px-4 py-2" disabled={busy}>Zapisz aktywację w rejestrze</button>
      </form>
      <form className="space-y-3 border-t pt-3 mt-3" onSubmit={event => { event.preventDefault(); send({ action: 'reserve', release: true, confirmed: true }) }}>
        <label className="flex gap-2"><input type="checkbox" required />Nie wykonałam żadnych operacji na saldzie w ActiveNow albo wszystkie zostały cofnięte.</label>
        <button disabled={busy} className="underline">Zwolnij rezerwację bez aktywacji</button>
      </form>
    </details>}
    {admin && reservation === 'free' && <details><summary className="cursor-pointer">Zapisz wykonany pełny zwrot</summary>
      <p className="my-3">Najpierw wykonaj zwrot w PayU. Przy aktywowanym voucherze skoryguj też pozostałą wartość w ActiveNow. Ten formularz unieważnia kod i zapisuje pełny zwrot; nie przelewa pieniędzy.</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); send({ action: 'refund', reference: form.get('reference'), reversal: form.get('reversal') || '', confirmed: form.get('confirmed') === 'on' }) }}>
        <label className="block">Referencja zwrotu PayU<input className="block w-full border rounded p-2" name="reference" required minLength={3} maxLength={500} /></label>
        <label className="block">Referencja korekty w ActiveNow<input className="block w-full border rounded p-2" name="reversal" required={active} minLength={active ? 3 : undefined} maxLength={500} /></label>
        <label className="flex gap-2"><input type="checkbox" name="confirmed" required />Potwierdzam wykonanie pełnego zwrotu i wymaganych korekt.</label>
        <button className="rounded border border-red-700 text-red-800 px-4 py-2" disabled={busy}>Unieważnij kod i zapisz zwrot</button>
      </form>
    </details>}
    <p role="status">{message}</p>
  </div>
}
