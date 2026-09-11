import type { Metadata } from 'next'
import { SignupLayout } from '../SignupLayout'

export const metadata: Metadata = {
  title: 'Zapisy na zajęcia indywidualne — uNick Academy',
  description: 'Lekcje 1:1 z nauczycielem, online lub w Rumianku, w terminie dopasowanym do Ciebie.',
  alternates: { canonical: '/zapisy/indywidualne' },
}

export default function ZapisyIndywidualnePage() {
  return (
    <SignupLayout
      form="indywidualne"
      title="Zapisy na zajęcia indywidualne"
      lead="Lekcje jeden na jeden, online albo w Rumianku. Powiedz nam, kiedy Ci pasuje, a dobierzemy nauczyciela."
    />
  )
}
