import type { Metadata } from 'next'
import { getCurrentTerms } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Regulamin — uNick Academy',
  description: 'Regulamin świadczenia usług edukacyjnych przez uNick Academy.',
  robots: { index: true, follow: true },
}

// Publiczna strona regulaminu. Do tej pory pełna treść istniała wyłącznie
// wklejona w rozwijaną harmonijkę w kreatorze zapisów — nie było dokumentu,
// do którego dałoby się podlinkować ani którego dałoby się zapisać.
export default async function RegulaminPage() {
  const terms = await getCurrentTerms()

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
          <h1 className="text-3xl font-black text-gray-900 mb-1">
            {terms?.title ?? 'Regulamin uNick Academy'}
          </h1>
          {terms && (
            <p className="text-sm text-gray-400 mb-8">Wersja {terms.version}</p>
          )}

          {terms ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {terms.content}
            </div>
          ) : (
            <p className="text-gray-500">
              Regulamin jest w tej chwili niedostępny. Napisz na{' '}
              <a href="mailto:hello@unick-academy.pl" className="font-bold text-[#23479E] underline">
                hello@unick-academy.pl
              </a>{' '}
              — wyślemy go mailem.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pytania? Napisz na{' '}
          <a href="mailto:hello@unick-academy.pl" className="underline">hello@unick-academy.pl</a>
        </p>
      </div>
    </div>
  )
}
