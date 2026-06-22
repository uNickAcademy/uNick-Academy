export const UNICKORN_TIERS = {
  UNICK_STUDENT: 'unick_student',
  EXTERNAL: 'external',
}

export const UNICKORN_STRIPE_PRICES = {
  [UNICKORN_TIERS.UNICK_STUDENT]: process.env.STRIPE_PRICE_UNICKORN_UNICK_STUDENT,
  [UNICKORN_TIERS.EXTERNAL]: process.env.STRIPE_PRICE_UNICKORN_EXTERNAL,
}

export const UNICKORN_MONTHLY_SESSION_LIMITS = {
  [UNICKORN_TIERS.UNICK_STUDENT]: Number(process.env.UNICKORN_MONTHLY_SESSION_LIMIT_UNICK_STUDENT ?? 30),
  [UNICKORN_TIERS.EXTERNAL]: Number(process.env.UNICKORN_MONTHLY_SESSION_LIMIT_EXTERNAL ?? 12),
}

export function tierForStudent(student) {
  return student.is_unick_student ? UNICKORN_TIERS.UNICK_STUDENT : UNICKORN_TIERS.EXTERNAL
}

export function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
