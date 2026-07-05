import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { DownloadRefreshForm } from '@/components/teenpreneurs/DownloadRefreshForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: getTpDictionary(locale).shop.refresh.title, robots: { index: false } }
}

// Expired-link recovery: request a fresh set of secure download links.
export default async function DownloadsRefreshPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ expired?: string }>
}) {
  const { locale } = await params
  const { expired } = await searchParams
  const dict = getTpDictionary(locale)
  const r = dict.shop.refresh

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
      {expired && (
        <p role="status" className="mb-8 rounded-2xl bg-tp-sun/40 px-5 py-4 font-tp-display font-medium text-tp-navy">
          {r.expiredBanner}
        </p>
      )}
      <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{r.title}</h1>
      <p className="mt-4 leading-relaxed text-tp-ink/80">{r.text}</p>
      <div className="mt-8">
        <DownloadRefreshForm dict={dict} locale={locale} />
      </div>
    </section>
  )
}
