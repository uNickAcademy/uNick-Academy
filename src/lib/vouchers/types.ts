export interface VoucherOrder {
  id: string
  idempotency_key: string
  request_hash: string
  buyer_name: string
  buyer_email: string
  gift: boolean
  invoice: { taxId: string; name: string; address: string } | null
  value: number
  cash_grosze: number
  bonus_grosze: number
  face_grosze: number
  status: 'pending' | 'paid' | 'canceled' | 'refunded'
  payu_order_id: string | null
  checkout_url: string | null
  voucher_code: string | null
  paid_at: string | null
  expires_on: string | null
  email_sent_at: string | null
  email_claimed_at: string | null
  created_at: string
}
