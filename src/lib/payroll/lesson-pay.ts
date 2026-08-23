/**
 * Wycena lekcji dla lektora.
 *
 * Jednostka lekcyjna to 30 minut i tak podane są stawki w cenniku nauczycieli.
 * Wartość konkretnej lekcji wynika z jej długości: 60 minut to dwie jednostki,
 * 40 minut to 1,33 jednostki.
 *
 * Wcześniej zarobki liczyły się z `teachers.hourly_rate`, o którym nie wiadomo
 * było, czy znaczy stawkę za godzinę, czy za lekcję, a ośmiu z trzynastu
 * lektorów nie miało go w ogóle, więc ich wypłata wychodziła zero.
 */

export const UNIT_MINUTES = 30

export function lessonUnits(startsAt: string, endsAt: string): number {
  const minutes = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000
  return minutes > 0 ? minutes / UNIT_MINUTES : 0
}

/** Kwota brutto należna lektorowi za jedną lekcję. */
export function lessonPay(
  lesson: { starts_at: string; ends_at: string },
  payRate30min: number | null | undefined,
): number {
  const rate = Number(payRate30min ?? 0)
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return lessonUnits(lesson.starts_at, lesson.ends_at) * rate
}
