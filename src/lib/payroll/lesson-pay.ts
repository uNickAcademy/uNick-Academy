/**
 * Wycena lekcji dla lektora.
 *
 * Jednostka lekcyjna to 30 minut i tak podane są stawki w cenniku nauczycieli.
 * Każda lekcja liczy się jako jedna taka jednostka, niezależnie od tego, jaką
 * długość ma zapisaną w kalendarzu. Skalowanie po minutach dawało kwoty
 * z groszami przy wpisach 40-minutowych, a lekcje i tak są 30-minutowe.
 *
 * Wcześniej zarobki liczyły się z `teachers.hourly_rate`, o którym nie wiadomo
 * było, czy znaczy stawkę za godzinę, czy za lekcję, a ośmiu z trzynastu
 * lektorów nie miało go w ogóle, więc ich wypłata wychodziła zero.
 */

export const UNIT_MINUTES = 30

/** Kwota brutto należna lektorowi za jedną lekcję: dokładnie jedna jednostka. */
export function lessonPay(payRate30min: number | null | undefined): number {
  const rate = Number(payRate30min ?? 0)
  return Number.isFinite(rate) && rate > 0 ? rate : 0
}
