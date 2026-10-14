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
const description = 'Zgłoś chęć udziału w bezpłatnych zajęciach dla dzieci i młodzieży 10–18 lat z gmin Tarnowo Podgórne, Rokietnica, Kaźmierz i Szamotuły.'

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
              Zajęcia są prowadzone po angielsku przez osoby z zagranicy. Angielski służy tu do rozmowy,
              współpracy i tworzenia — nie jest szkolnym przedmiotem ani egzaminem.
            </p>
            <p className={styles.eligibilityNote}>
              <strong>Warunek udziału:</strong> dziecko musi mieszkać w gminie Tarnowo Podgórne,
              Rokietnica, Kaźmierz lub Szamotuły.
            </p>
            <Button href="#deklaracja">{copy.projects.interestButton}</Button>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.project}`}>
        <div className="container">
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
            <span className="eyebrow">Zgłoszenie chęci udziału</span>
            <h2>{copy.form.title}</h2>
            {copy.form.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </header>
          <FoundationInterestForm copy={copy.form} locale="pl" />
        </div>
      </section>
    </>
  )
}
