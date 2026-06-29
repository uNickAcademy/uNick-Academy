import { redirect } from 'next/navigation'

// Strona główna platformy = marketingowy landing pod /[locale].
// Domyślnie kierujemy na polski; przełącznik języka prowadzi na /en.
export default function RootPage() {
  redirect('/pl')
}
