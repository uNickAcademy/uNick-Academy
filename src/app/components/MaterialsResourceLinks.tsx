import Image from 'next/image'
import Link from 'next/link'
import { lessonMaterials } from '@/app/lib/lesson-materials'
import styles from './lesson-materials.module.css'

export default function MaterialsResourceLinks({ language, compact = false }: { language: 'pl' | 'en'; compact?: boolean }) {
  const pl = language === 'pl'
  return (
    <div className={`${styles.resourceLinks} ${compact ? styles.compactResources : ''}`}>
      <Link className={styles.feature} href={compact ? `/${language}/meterials` : '#flashcards'}>
        <div className={styles.featureArt} aria-hidden="true">
          <div className={styles.samplePicture}>
            <Image src="/lesson-materials/previews/actions.webp" alt="" width={360} height={180} unoptimized />
          </div>
          <div className={styles.sampleWord}>jump</div>
        </div>
        <div className={styles.featureBody}>
          <div>
            <span className={styles.featureTitle}>{compact ? (pl ? 'Materiały do zajęć' : 'Lesson Materials') : (pl ? 'Fiszki' : 'Flashcards')}</span>
            <span className={styles.featureHint}>{lessonMaterials.length} {pl ? 'tematy · PDF do druku' : 'topics · printable PDFs'}</span>
          </div>
        </div>
      </Link>
      <Link className={styles.feature} href={`/${language}/conversation-cards`}>
        <div className={styles.conversationArt} aria-hidden="true">
          <div className={styles.miniQuestion}>
            <Image src="/brand/unick-academy-logo.png" alt="" width={654} height={286} unoptimized />
            <span>What makes you lose track of time?</span>
            <small>unick-academy.pl</small>
          </div>
        </div>
        <div className={styles.featureBody}>
          <div>
            <span className={styles.featureTitle}>{pl ? 'Karty do rozmowy' : 'Conversation Cards'}</span>
            <span className={styles.featureHint}>{pl ? '100 pytań · losowanie i PDF do druku' : '100 questions · draw online or print'}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
