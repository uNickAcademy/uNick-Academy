import { redirect } from 'next/navigation'
import { voucherStaff } from '@/lib/vouchers/staff'
import { VoucherActions } from './VoucherActions'

export const dynamic = 'force-dynamic'
const amount = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value / 100)
const statusLabel: Record<string,string> = { pending: 'Oczekuje na płatność', paid: 'Opłacony', canceled: 'Anulowany', refunded: 'Zwrócony' }

export default async function VouchersPage() {
  const staff = await voucherStaff()
  if (!staff) redirect('/login')
  const result = await staff.db.from('voucher_orders').select('*,voucher_activations(*),voucher_activation_claims(*)').order('created_at', { ascending: false }).limit(100)
  return <div className="max-w-5xl mx-auto p-5 space-y-6">
    <header><h1 className="text-2xl font-semibold">Vouchery Black Friday</h1><p className="mt-2 text-gray-600">Wpłaty, zniżki i pierwsze przypisanie do odbiorcy. Rejestr nie zmienia automatycznie rozliczeń ActiveNow.</p></header>
    {result.error ? <p role="alert">Rejestr nie jest teraz dostępny. Spróbuj później.</p> : !result.data?.length ? <p>Nie ma jeszcze zamówień. Pierwsze pojawi się po rozpoczęciu zakupu.</p> : result.data.map(order => {
      const activation = order.voucher_activations?.[0]
      const claim = order.voucher_activation_claims?.find((row: { released_at: string | null; completed_at: string | null }) => !row.released_at && !row.completed_at)
      const reservation = !claim ? 'free' : claim.actor_id === staff.user.id ? 'mine' : 'other'
      return <article key={order.id} className="bg-white border rounded-xl p-5 space-y-4">
        <div><h2 className="text-lg font-semibold">{order.value} zł · {statusLabel[order.status] || order.status}</h2><p>{order.buyer_name} · {order.buyer_email} · {order.gift ? 'Na prezent' : 'Dla siebie'}</p><p className="text-xs text-gray-500 break-all">Zamówienie: {order.id}<br />PayU: {order.payu_order_id || 'Jeszcze nie utworzono płatności'}</p></div>
        <dl className="flex flex-wrap gap-6"><div><dt>{order.status === 'paid' ? 'Rzeczywista wpłata' : order.status === 'refunded' ? 'Wpłata przed zwrotem' : 'Kwota do zapłaty'}</dt><dd className="font-semibold">{amount(order.cash_grosze)}</dd></div><div><dt>Zniżka promocyjna</dt><dd className="font-semibold">{amount(order.bonus_grosze)}</dd></div><div><dt>Wartość na zajęcia</dt><dd className="font-semibold">{amount(order.face_grosze)}</dd></div></dl>
        {order.status === 'paid' && <p>Kod: <strong className="font-mono break-all">{order.voucher_code}</strong><br />Ważny do: {order.expires_on}<br />E-mail: {order.email_sent_at ? 'Przyjęty przez dostawcę poczty' : 'Oczekuje na dostarczenie'}</p>}
        {order.invoice && <p>Dane do faktury: {order.invoice.name}, NIP {order.invoice.taxId}, {order.invoice.address}</p>}
        {activation && <p className="rounded bg-green-50 p-3">Aktywowany na koncie ActiveNow {activation.active_now_client_id}. Referencje: {activation.active_now_reference}</p>}
        {order.status === 'paid' && <VoucherActions orderId={order.id} active={Boolean(activation)} admin={staff.role === 'admin'} emailSent={Boolean(order.email_sent_at)} reservation={reservation} />}
      </article>
    })}
    <p className="text-sm text-gray-600">Widok obejmuje 100 ostatnich zamówień. Dane do faktury są przekazywane do obsługi, bez automatycznego wystawienia dokumentu.</p>
  </div>
}
