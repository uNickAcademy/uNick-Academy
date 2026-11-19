import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MaterialsAccessForm from '@/app/components/MaterialsAccessForm'
import { lessonMaterials } from '@/app/lib/lesson-materials'
import { buildMetadata } from '@/app/lib/seo'
import { hasMaterialsAccess, materialLocale } from '@/lib/lesson-materials/access'
import { materialsCopy } from '@/lib/lesson-materials/copy'
import styles from '@/app/components/lesson-materials.module.css'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; topic: string }>
  searchParams: Promise<{ pdf?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale, topic } = await params
  const language = materialLocale(locale)
  const material = lessonMaterials.find(item => item.slug === topic)
  if (!material) return {}
  return buildMetadata({
    locale: language,
    path: `/meterials/${topic}`,
    title: material.title[language],
    description: materialsCopy[language].accessIntro,
    ogImage: `/lesson-materials/previews/${topic}.webp`,
  })
}

export default async function MaterialPreviewPage({ params, searchParams }: Props) {
  const { locale, topic } = await params
  const language = materialLocale(locale)
  const material = lessonMaterials.find(item => item.slug === topic)
  if (!material) notFound()
  const t = materialsCopy[language]
  const [access, query] = await Promise.all([hasMaterialsAccess(), searchParams])

  return (
    <div className={`container ${styles.library}`}>
      <header className={styles.libraryHeader}>
        <Link className={styles.back} href={`/${language}/meterials`}>← {t.all}</Link>
        <h1>{material.title[language]}</h1>
        <p>{t.sample}</p>
      </header>
      {query.pdf === 'unavailable' && <p role="alert" className={styles.formError}>{t.pdfUnavailable}</p>}
      <div className={styles.previewLayout}>
        <Image
          className={styles.fullSample} src={`/lesson-materials/samples/${topic}.webp`}
          width={893} height={1263} alt={`${material.title[language]} — ${t.sampleAlt}`} unoptimized priority
        />
        {access ? (
          <div className={styles.previewDownload}>
            <p>{t.accessReady}</p>
            <a className={styles.accessButton} href={`/lesson-materials/${topic}.pdf?lang=${language}`} target="_blank" rel="noopener">
              {t.download} <span aria-hidden="true">↗</span>
            </a>
          </div>
        ) : <MaterialsAccessForm language={language} topic={topic} />}
      </div>
    </div>
  )
}
