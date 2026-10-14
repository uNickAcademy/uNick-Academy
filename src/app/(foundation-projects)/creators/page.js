import Image from 'next/image'
import Link from 'next/link'
import Button from '../../components/Button'
import FoundationInterestForm from '../../components/foundation/FoundationInterestForm'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import SectionHeading from '../../components/SectionHeading'
import { getDictionary } from '../../lib/dictionaries'
import { siteConfig } from '../../lib/site-config'
import styles from '../../[locale]/foundation/FoundationPage.module.css'

const title = 'Kreatorzy Przyszłości – bezpłatne zajęcia dla młodzieży'
const description = 'Wstępna rejestracja do bezpłatnego projektu dla dzieci i młodzieży 10–18 lat z gmin Tarnowo Podgórne, Rokietnica, Kaźmierz i Szamotuły.'

export const metadata = {
  title,
  description,
  alternates: { canonical: '/creators' },
  openGraph: {
    title: `${title} | uNick Academy`,
    description,
    url: `${siteConfig.url}/creators`,
    locale: 'pl_PL',
    type: 'website',
    images: [{ url: '/foundation/kreatorzy-przyszlosci-2026.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/foundation/kreatorzy-przyszlosci-2026.png'],
  },
}

function Activity({ activity, index }) {
  return (
    <Reveal as="article" className={styles.activity}>
      <div><b>0{index + 1}</b><span>{activity.age}</span></div>
      <h3>{activity.title}</h3>
      {activity.subtitle && <h4>{activity.subtitle}</h4>}
      <p className={styles.intro}>{activity.intro}</p>
      {activity.bullets && <ul>{activity.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
      {activity.roles && <p><strong>Możliwe role:</strong> {activity.roles.join(', ')}.</p>}
      {activity.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {activity.facts && (
        <div className={styles.activityFacts}>
          <strong>Najważniejsze informacje</strong>
          <ul>{activity.facts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}
      <aside><strong>Cel społeczny</strong><p>{activity.socialGoal}</p></aside>
    </Reveal>
  )
}

export default function CreatorsPage() {
  const copy = getDictionary('pl').foundation
  const url = `${siteConfig.url}/creators`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          url,
          name: title,
          description,
          inLanguage: 'pl-PL',
          isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
        }}
      />

      <section className={styles.creatorsHero}>
        <div className={`container ${styles.creatorsHeroGrid}`}>
          <Reveal className={styles.creatorsPoster}>
            <Image
              src="/foundation/kreatorzy-przyszlosci-2026.png"
              alt="Plakat projektu Kreatorzy Przyszłości"
              width={1122}
              height={1402}
              priority
              sizes="(max-width: 860px) 88vw, 390px"
            />
          </Reveal>
          <Reveal className={styles.creatorsHeroCopy}>
            <Link href="/pl/foundation#deklaracja" className={styles.backLinkLight}>← Wróć do Fundacji</Link>
            <span className="eyebrow">{copy.projects.eyebrow}</span>
            <h1>{copy.projects.title}</h1>
            <p className={styles.creatorsLead}>{copy.projects.subtitle}</p>
            <p>
              Bezpłatny projekt dla dzieci i młodzieży w wieku 10–18 lat z gmin Tarnowo Podgórne,
              Rokietnica, Kaźmierz i Szamotuły. Zajęcia będą prowadzone po angielsku przez osoby z zagranicy.
            </p>
            <p className={styles.preliminaryNote}>
              To wstępna rejestracja. Projekt planujemy rozpocząć w listopadzie 2026 r., po finalizacji
              formalnych ustaleń dotyczących dofinansowania. Zgłoszenie nie zobowiązuje jeszcze do udziału.
            </p>
            <Button href="#deklaracja">{copy.projects.interestButton}</Button>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.project}`}>
        <div className="container">
          <div className={styles.split}>
            <div>
              {copy.project.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p><strong>{copy.project.fundingOutcome}</strong></p>
            </div>
            <aside className={styles.facts}>
              <small>{copy.project.periodLabel}</small>
              <strong>{copy.project.period}</strong>
              <small>{copy.project.locationsLabel}</small>
              <strong>{copy.project.locations.join(' · ')}</strong>
              <small>Planowana wielkość grup</small>
              <strong>{copy.project.groupSize}</strong>
              <p>{copy.project.groupNote}</p>
            </aside>
          </div>
          <ul className={styles.highlights}>{copy.project.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
          <aside className={styles.funding}>
            <small>Informacja formalna</small>
            <h2>{copy.project.funding.title}</h2>
            {copy.project.funding.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <strong>{copy.project.funding.disclaimer}</strong>
          </aside>
          <div className={styles.roles}>
            <div>
              <small>Organizator i wnioskodawca</small>
              <h3>uNick Academy Foundation</h3>
              <p>Fundacja odpowiada za projekt, wniosek o dofinansowanie i działalność społeczną.</p>
            </div>
            <div>
              <small>Planowany podmiot prowadzący zajęcia</small>
              <h3>uNick Academy</h3>
              <p>Szkoła wnosi doświadczenie edukacyjne i kadrę prowadzącą zajęcia w języku angielskim.</p>
            </div>
          </div>
          <SectionHeading
            eyebrow={copy.activities.eyebrow}
            title={copy.activities.title}
            subtitle={copy.activities.languageNote}
          />
          <div className={styles.activities}>
            {copy.activities.items.map((activity, index) => (
              <Activity activity={activity} index={index} key={activity.id} />
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.declaration}`} id="deklaracja">
        <div className="container">
          <header className={styles.declarationIntro}>
            <span className="eyebrow">Wstępna rejestracja</span>
            <h2>{copy.form.title}</h2>
            {copy.form.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </header>
          <FoundationInterestForm copy={copy.form} locale="pl" />
        </div>
      </section>
    </>
  )
}
