import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns"
import { pl } from "date-fns/locale"

export function formatPLN(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—"
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—"
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "dd.MM.yyyy", { locale: pl })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: pl })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  if (isToday(d)) return "dziś"
  if (isTomorrow(d)) return "jutro"
  if (isPast(d)) return formatDistanceToNow(d, { locale: pl, addSuffix: true })
  return format(d, "dd.MM.yyyy", { locale: pl })
}

export function formatMonth(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "LLLL yyyy", { locale: pl })
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pl-PL").format(value)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
