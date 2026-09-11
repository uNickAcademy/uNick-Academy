import type { Metadata } from 'next'
import { SignupLayout } from '../SignupLayout'

export const metadata: Metadata = {
  title: 'Zapisy na zajęcia grupowe — uNick Academy',
  description: 'Zapisz się na zajęcia grupowe w Rumianku lub online. Wybierz grupę i termin, resztą zajmiemy się my.',
  alternates: { canonical: '/zapisy/grupowe' },
}

export default function ZapisyGrupowePage() {
  return (
    <SignupLayout
      form="grupowe"
      title="Zapisy na zajęcia grupowe"
      lead="Wybierz grupę i termin, który Wam pasuje. Odezwiemy się, żeby potwierdzić miejsce."
    />
  )
}
