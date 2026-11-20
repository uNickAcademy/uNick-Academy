'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ConversationCard } from '../lib/conversation-cards'
import { conversationCopy } from '../lib/conversation-cards-copy'
import styles from './conversation-cards.module.css'

type Language = 'pl' | 'en'
type Theme = { slug: string; title: { pl: string; en: string } }
type Props = { language: Language; cards: ConversationCard[]; themes: Theme[]; hasAccess: boolean }

function Card({ card, theme, large = false }: { card: ConversationCard; theme: string; large?: boolean }) {
  return (
    <article className={`${styles.card} ${large ? styles.cardLarge : ''}`} aria-label={theme}>
      <div className={styles.cardBrand}>
        <Image src="/brand/unick-academy-logo.png" alt="uNick Academy" width={654} height={286} unoptimized />
        <span className={styles.cardNumber}>{String(card.number).padStart(2, '0')}</span>
      </div>
      <div className={styles.questionBody}>
        <span className={styles.cardTheme}>{theme}</span>
        <p className={styles.cardQuestion} lang="en">{card.question}</p>
      </div>
      <span className={styles.cardFooter}>unick-academy.pl</span>
    </article>
  )
}

export default function ConversationCards({ language, cards, themes, hasAccess }: Props) {
  const t = conversationCopy[language]
  const [theme, setTheme] = useState('all')
  const [drawn, setDrawn] = useState<number[]>([])
  const pool = theme === 'all' ? cards : cards.filter(card => card.theme === theme)
  const drawnInPool = drawn.filter(number => pool.some(card => card.number === number))
  const current = pool.find(card => card.number === drawn[drawn.length - 1])
  const finished = drawnInPool.length >= pool.length
  const title = (slug: string) => themes.find(item => item.slug === slug)?.title[language] ?? slug

  function draw() {
    const remaining = pool.filter(card => !drawn.includes(card.number))
    if (!remaining.length) return
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    setDrawn(previous => [...previous, next.number])
  }

  return (
    <section id="draw" className={styles.play} aria-labelledby="draw-heading">
      <div className={styles.playHeading}>
        <div>
          <span className={styles.eyebrow}>{hasAccess ? t.online : t.trySample}</span>
          <h2 id="draw-heading">{t.drawTitle}</h2>
        </div>
        <label className={styles.filter}>
          <span>{t.theme}</span>
          <select value={theme} onChange={event => setTheme(event.target.value)}>
            <option value="all">{t.allThemes}</option>
            {themes.map(item => <option key={item.slug} value={item.slug}>{item.title[language]}</option>)}
          </select>
        </label>
      </div>
      <div className={styles.stage} aria-live="polite" aria-atomic="true">
        {current ? <Card key={current.number} card={current} theme={title(current.theme)} large /> : (
          <div className={styles.placeholder}>
            <Image src="/brand/unick-academy-logo.png" alt="uNick Academy" width={654} height={286} unoptimized />
            <p lang="en">Let’s talk.</p>
            <span>{t.start}</span>
            <small>unick-academy.pl</small>
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.drawButton} onClick={draw} disabled={finished}>{t.draw}</button>
        <button type="button" className={styles.secondary} onClick={() => setDrawn([])} disabled={drawn.length === 0}>{t.restart}</button>
        <p className={styles.counter} role="status">{finished ? t.allDrawn : t.drawn(drawnInPool.length, pool.length)}</p>
      </div>
      {!hasAccess && <p className={styles.sampleNotice}>{t.sampleNotice} <a href="#access">{t.unlock}</a></p>}
      <details className={styles.browse}>
        <summary>{hasAccess ? t.browse : t.browseSamples}</summary>
        <ul className={styles.grid}>
          {pool.map(card => <li key={card.number}><Card card={card} theme={title(card.theme)} /></li>)}
        </ul>
      </details>
    </section>
  )
}
