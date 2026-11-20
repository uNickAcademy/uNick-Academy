"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { conversationCards, conversationThemes, type ConversationCard } from "../lib/conversation-cards"
import styles from "./conversation-cards.module.css"

type Language = "pl" | "en"

const copy = {
  pl: {
    eyebrow: "Do wspólnej rozmowy",
    title: "Karty do rozmowy",
    intro:
      "100 pytań po angielsku, które pomagają naprawdę się poznać. Losujcie je na zajęciach, przy rodzinnym stole albo w długiej podróży. Nie ma tu złych odpowiedzi, liczy się rozmowa.",
    steps: [
      "Wylosuj kartę i przeczytaj pytanie na głos.",
      "Odpowiedz po swojemu. Proste angielskie słowa w zupełności wystarczą.",
      "Na koniec napisz pytanie dla następnej osoby, nie wiedząc, kto na nie odpowie.",
    ],
    theme: "Temat",
    allThemes: "Wszystkie",
    draw: "Losuj kartę",
    restart: "Zacznij od nowa",
    start: "Kliknij „Losuj kartę”, żeby zacząć.",
    drawn: (n: number, total: number) => `Wylosowano ${n} z ${total}`,
    allDrawn: "Wszystkie karty z tego tematu już były. Zacznijcie od nowa!",
    print: "Drukuj karty (A4)",
    printHint: "Wydrukuj na grubszym papierze i wytnij wzdłuż przerywanych linii. Ostatnia strona to puste karty na Wasze własne pytania.",
    browse: "Wszystkie pytania",
  },
  en: {
    eyebrow: "Made for talking",
    title: "Conversation Cards",
    intro:
      "100 questions in English that help people really get to know each other. Draw them in class, around the family table or on a long journey. There are no wrong answers here, only good conversations.",
    steps: [
      "Draw a card and read the question out loud.",
      "Answer in your own way. Simple English is more than enough.",
      "At the end, write a question for the next person, without knowing who will answer it.",
    ],
    theme: "Theme",
    allThemes: "All themes",
    draw: "Draw a card",
    restart: "Start again",
    start: "Press 'Draw a card' to begin.",
    drawn: (n: number, total: number) => `${n} of ${total} drawn`,
    allDrawn: "You've drawn every card in this theme. Start again!",
    print: "Print the cards (A4)",
    printHint: "Print on thick paper and cut along the dashed lines. The last page has blank cards for your own questions.",
    browse: "All the questions",
  },
}

const themeTitle = (slug: string, language: Language) =>
  conversationThemes.find((theme) => theme.slug === slug)?.title[language] ?? slug

const englishTheme = (slug: string) => themeTitle(slug, "en")

function Card({ card, language, large = false }: { card: ConversationCard; language: Language; large?: boolean }) {
  return (
    <article className={`${styles.card} ${large ? styles.cardLarge : ""}`}>
      <div className={styles.cardTop}>
        <span className={styles.cardTheme}>{themeTitle(card.theme, language)}</span>
        <span className={styles.cardNumber}>{String(card.number).padStart(2, "0")}</span>
      </div>
      <p className={styles.cardQuestion}>{card.question}</p>
      <span className={styles.cardFooter}>uNick Academy</span>
    </article>
  )
}

export default function ConversationCards({ language }: { language: Language }) {
  const t = copy[language]
  const [theme, setTheme] = useState<string>("all")
  const [drawn, setDrawn] = useState<number[]>([])

  const pool = useMemo(
    () => (theme === "all" ? conversationCards : conversationCards.filter((card) => card.theme === theme)),
    [theme],
  )
  const drawnInPool = drawn.filter((number) => pool.some((card) => card.number === number))
  const current = conversationCards.find((card) => card.number === drawn[drawn.length - 1])
  const currentInPool = current && pool.some((card) => card.number === current.number) ? current : undefined
  const finished = drawnInPool.length >= pool.length

  function draw() {
    const remaining = pool.filter((card) => !drawn.includes(card.number))
    if (remaining.length === 0) return
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    setDrawn((previous) => [...previous, next.number])
  }

  function chooseTheme(slug: string) {
    setTheme(slug)
  }

  const sheets = conversationThemes.map((item) => conversationCards.filter((card) => card.theme === item.slug))

  return (
    <>
      <div className={`container ${styles.page} ${styles.screen}`}>
        <header className={styles.hero}>
          <div>
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
          <Image
            className={styles.mascot}
            src="/brand/unickorn-mascot-wave.png"
            alt=""
            width={220}
            height={220}
            priority
          />
        </header>

        <ol className={styles.steps}>
          {t.steps.map((step, index) => (
            <li key={step}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <section className={styles.play} aria-labelledby="draw-heading">
          <h2 id="draw-heading" className="visually-hidden">{t.draw}</h2>
          <fieldset className={styles.filters}>
            <legend>{t.theme}</legend>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={theme === "all"}
              onClick={() => chooseTheme("all")}
            >
              {t.allThemes}
            </button>
            {conversationThemes.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={styles.chip}
                aria-pressed={theme === item.slug}
                onClick={() => chooseTheme(item.slug)}
              >
                {item.title[language]}
              </button>
            ))}
          </fieldset>

          <div className={styles.stage} aria-live="polite">
            {currentInPool ? (
              <Card key={currentInPool.number} card={currentInPool} language={language} large />
            ) : (
              <div className={styles.placeholder}>{t.start}</div>
            )}
          </div>

          <div className={styles.controls}>
            <button type="button" className="pill-btn" onClick={draw} disabled={finished}>
              {t.draw}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setDrawn([])} disabled={drawn.length === 0}>
              {t.restart}
            </button>
            <span className={styles.counter}>
              {finished ? t.allDrawn : t.drawn(drawnInPool.length, pool.length)}
            </span>
          </div>
        </section>

        <section className={styles.printBox}>
          <p>{t.printHint}</p>
          <button type="button" className={styles.secondary} onClick={() => window.print()}>
            {t.print}
          </button>
        </section>

        <section className={styles.browse} aria-labelledby="browse-heading">
          <h2 id="browse-heading">{t.browse}</h2>
          <ul className={styles.grid}>
            {pool.map((card) => (
              <li key={card.number}>
                <Card card={card} language={language} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.print} aria-hidden="true">
        {sheets.map((cards, index) => (
          <div className={styles.sheet} key={index}>
            {cards.map((card) => (
              <div className={styles.printCard} key={card.number}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTheme}>{englishTheme(card.theme)}</span>
                  <span className={styles.cardNumber}>{String(card.number).padStart(2, "0")}</span>
                </div>
                <p className={styles.cardQuestion}>{card.question}</p>
                <span className={styles.cardFooter}>uNick Academy · Conversation Cards</span>
              </div>
            ))}
          </div>
        ))}
        <div className={styles.sheet}>
          {Array.from({ length: 10 }, (_, index) => (
            <div className={styles.printCard} key={index}>
              <div className={styles.cardTop}>
                <span className={styles.cardTheme}>Pass it on</span>
                <span className={styles.askedBy}>Asked by: ____________</span>
              </div>
              <div className={styles.lines}>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.cardFooter}>uNick Academy · Conversation Cards</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
