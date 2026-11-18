import Image from "next/image"
import Link from "next/link"
import { getDictionary } from "../../lib/dictionaries"
import { lessonMaterials } from "../../lib/lesson-materials"
import { buildMetadata } from "../../lib/seo"
import styles from "../../components/lesson-materials.module.css"

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params
  const { lessonMaterials: t } = getDictionary(locale)
  return buildMetadata({ locale, path: "/meterials", title: t.title, description: t.description })
}

export default async function LessonMaterialsPage({ params }: PageProps) {
  const { locale } = await params
  const language = locale === "pl" ? "pl" : "en"
  const { lessonMaterials: t, teachersZone } = getDictionary(language)

  return (
    <div className={`container ${styles.library}`}>
      <header className={styles.libraryHeader}>
        <Link href={`/${language}/teachers-zone`} className={styles.back}>
          <span aria-hidden="true">←</span> {teachersZone.hero.eyebrow}
        </Link>
        <h1>{t.title}</h1>
        <p>{t.description}</p>
      </header>

      <ul className={styles.grid}>
        {lessonMaterials.map(({ slug, title }) => (
          <li key={slug}>
            <a
              className={styles.tile}
              href={`/lesson-materials/${slug}.pdf`}
              target="_blank"
              rel="noopener"
            >
              <Image
                className={styles.tileImage}
                src={`/lesson-materials/previews/${slug}.webp`}
                alt=""
                width={360}
                height={180}
                unoptimized
              />
              <div className={styles.tileContent}>
                <h2>{title[language]}</h2>
                <span className={styles.tileAction}>
                  {t.openPdf}
                  <span aria-hidden="true">↗</span>
                  <span className="visually-hidden"> ({t.newTab})</span>
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
