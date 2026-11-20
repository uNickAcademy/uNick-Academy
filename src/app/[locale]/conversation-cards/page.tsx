import Image from 'next/image'
import Link from 'next/link'
import ConversationCards from '../../components/ConversationCards'
import MaterialsAccessForm from '../../components/MaterialsAccessForm'
import { conversationCards, conversationThemes } from '../../lib/conversation-cards'
import { conversationCopy } from '../../lib/conversation-cards-copy'
import { buildMetadata } from '../../lib/seo'
import { hasMaterialsAccess, materialLocale } from '@/lib/lesson-materials/access'
import { CONVERSATION_MATERIAL } from '@/lib/lesson-materials/catalogue'
import styles from '../../components/conversation-cards.module.css'
import materialsStyles from '../../components/lesson-materials.module.css'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ pdf?: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params
  const language = materialLocale(locale)
  return buildMetadata({ locale: language, path: '/conversation-cards', title: conversationCopy[language].title, description: conversationCopy[language].intro })
}

export default async function ConversationCardsPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const language = materialLocale(locale)
  const [hasAccess, query] = await Promise.all([hasMaterialsAccess(), searchParams])
  const t = conversationCopy[language]
  // Only send public samples to unauthenticated visitors, including the RSC payload.
  const cards = hasAccess ? conversationCards : conversationCards.filter(card => [1, 11, 91].includes(card.number))
  const themes = conversationThemes.filter(theme => cards.some(card => card.theme === theme.slug)).map(({ slug, title }) => ({ slug, title }))

  return (
    <div className={`container ${styles.page}`}>
      <Link className={materialsStyles.back} href={`/${language}/meterials`}>{t.back}</Link>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <Image className={styles.mascot} src="/brand/unickorn-mascot-wave.png" alt="" width={180} height={180} priority />
      </header>
      <p className={styles.how}>{t.how}</p>
      {hasAccess && <p className={styles.accessReady}>{t.accessReady}</p>}
      <ConversationCards language={language} cards={cards} themes={themes} hasAccess={hasAccess} />
      <section className={styles.printBox} aria-labelledby="print-heading">
        <Image className={styles.samplePage} src="/lesson-materials/samples/conversation-cards.webp" alt={t.previewAlt} width={893} height={1263} unoptimized />
        <div>
          <span className={styles.eyebrow}>PDF · A4 · 11 {language === 'pl' ? 'stron' : 'pages'}</span>
          <h2 id="print-heading">{t.printTitle}</h2>
          <p>{t.printIntro}</p>
          <p>{t.printHint}</p>
          {query.pdf === 'unavailable' && <p role="alert" className={materialsStyles.formError}>{t.unavailable}</p>}
          <a className={materialsStyles.accessButton} href={hasAccess ? `/lesson-materials/conversation-cards.pdf?lang=${language}` : '#access'} target={hasAccess ? '_blank' : undefined} rel={hasAccess ? 'noopener' : undefined}>
            {hasAccess ? t.download : t.unlock}
            {hasAccess && <span className="visually-hidden"> ({t.newTab})</span>}
          </a>
        </div>
      </section>
      {!hasAccess && <MaterialsAccessForm language={language} topic={CONVERSATION_MATERIAL} />}
    </div>
  )
}
