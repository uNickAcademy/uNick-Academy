// Shared display metadata for referral statuses - safe to import from client
// components (no Prisma/server-only code in here).
export const REFERRAL_STATUS_LABELS = {
  pending: { label: 'Oczekuje na zakup', color: '#9CA3AF' },
  qualified: { label: 'Zakwalifikowano', color: '#2563EB' },
  reward_pending: { label: 'Do weryfikacji', color: '#D97706' },
  rewarded: { label: 'Nagroda przyznana', color: '#16A34A' },
  rejected: { label: 'Odrzucono', color: '#DC2626' },
  cancelled: { label: 'Anulowano', color: '#6B7280' },
}

export function referralStatusLabel(status) {
  return REFERRAL_STATUS_LABELS[status]?.label ?? status
}

export function referralStatusColor(status) {
  return REFERRAL_STATUS_LABELS[status]?.color ?? '#6B7280'
}
