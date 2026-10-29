import Image from 'next/image'
import Link from 'next/link'
import Button from '../../components/Button'
import FoundationInterestForm from '../../components/foundation/FoundationInterestForm'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import SectionHeading from '../../components/SectionHeading'
import { getDictionary } from '../../lib/dictionaries'
import { siteConfig } from '../../lib/site-config'
import { projectSchedule } from '@/lib/foundation/schedule'
import styles from '../../[locale]/foundation/FoundationPage.module.css'

const title = 'Kreatorzy Przyszłości – bezpłatne zajęcia dla dzieci i młodzieży'
const description = 'Bezpłatny program rozwoju kreatywności, przedsiębiorczości i umiejętności społecznych dla dzieci i młodzieży 10–18 lat z czterech gmin.'

const courseVisuals = {
  teenpreneurs: {
    image: '/foundation/creators/teenpreneurs-ben.jpg',
    emoji: '💡',
    alt: 'Ben i młodzież pracujący wspólnie nad pomysłem podczas zajęć Teenpreneurs',
  },
  podcasts_audio_video: {
    image: '/foundation/creators/podcasts-ben.jpg',
    emoji: '🎙️',
    alt: 'Ben i młodzież nagrywający podcast w jasnym studiu',
  },
  teenage_talk: {
    image: '/foundation/creators/teenage-talk-ben.jpg',
    emoji: '💬',
    alt: 'Ben rozmawiający z grupą młodzieży podczas zajęć Teenage Talk',
  },
  art_performance_9_13: {
    image: '/foundation/creators/art-performance-ben.jpg',
    emoji: '🎭',
    alt: 'Ben i młodzież podczas kreatywnych zajęć ruchowych i artystycznych',
  },
}

const quickFacts = [
  ['10–18 lat', 'wiek uczestników'],
  ['4 gminy', 'lokalne grupy'],
  ['0 zł', 'udział bezpłatny'],
  ['ok. 6 miesięcy', 'czas programu'],
]

const audiencePoints = [
  'mają od 10 do 18 lat i mieszkają w jednej z czterech wymienionych gmin,',
  'chcą rozwijać swoje zainteresowania i poznawać nowych ludzi,',
  'lubią tworzyć, rozmawiać, eksperymentować lub chciałyby spróbować czegoś nowego,',
  'chcą nabrać odwagi do komunikowania się po angielsku.',
]

const organizationFacts = [
  ['Koszt', '0 zł — udział całkowicie bezpłatny'],
  ['Start', 'listopad 2026'],
  ['Czas trwania', 'około 6 miesięcy'],
  ['Liczba grup', '8 — po dwie w każdej gminie'],
  ['Liczba miejsc', '12 osób w grupie'],
  ['Organizator', 'uNick Academy Foundation'],
]

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
    images: [{ url: '/foundation/kreatorzy-przyszlosci-card-v2.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/foundation/kreatorzy-przyszlosci-card-v2.png'],
  },
}

function CourseCard({ course }) {
  const visual = courseVisuals[course.id]

  return (
    <Reveal as="article" className={styles.creatorCourseCard}>
      <div className={styles.creatorCourseImage}>
        <Image
          src={visual.image}
          alt={visual.alt}
          width={1536}
          height={1024}
          sizes="(max-width: 700px) 100vw, 50vw"
        />
      </div>
      <div className={styles.creatorCourseBody}>
        <div className={styles.creatorCourseMeta}>
          <span aria-hidden="true">{visual.emoji}</span>
          <span>{course.age}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.intro}</p>
      </div>
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
          '@type': 'EducationalOccupationalProgram',
          url,
          name: title,
          description,
          inLanguage: 'pl-PL',
          provider: { '@type': 'Organization', name: 'uNick Academy Foundation', url: siteConfig.url },
          timeToComplete: 'P6M',
          isAccessibleForFree: true,
        }}
      />

      <section className={styles.creatorsHero}>
        <div className={`container ${styles.creatorsHeroGrid}`}>
          <Reveal className={styles.creatorsPoster}>
            <Image
              src="/foundation/kreatorzy-przyszlosci-card-v2.png"
              alt="Kreatorzy Przyszłości — bezpłatne zajęcia dla młodzieży"
              width={1122}
              height={1402}
              priority
              sizes="(max-width: 860px) 88vw, 390px"
            />
          </Reveal>
          <Reveal className={styles.creatorsHeroCopy}>
            <Link href="/pl/foundation#deklaracja" className={styles.backLinkLight}>← Wróć do Fundacji</Link>
            <span className="eyebrow">Bezpłatny program dla młodych ludzi</span>
            <h1>Kreatorzy Przyszłości</h1>
            <p className={styles.creatorsLead}>
              <strong>Bezpłatny program rozwoju kreatywności, przedsiębiorczości i umiejętności społecznych dla dzieci i młodzieży w wieku 10–18 lat.</strong>
            </p>
            <p>
              <strong>uNick Academy Foundation</strong> przygotowuje wyjątkową przestrzeń dla młodych ludzi z czterech gmin: <strong>Tarnowo Podgórne, Rokietnica, Kaźmierz i Szamotuły</strong>.
            </p>
            <p>
              Przez sześć miesięcy uczestnicy będą mogli poznawać nowych ludzi, rozwijać swoje zainteresowania, odkrywać własne możliwości i wspólnie realizować pomysły.
            </p>
            <p className={styles.creatorNoSchool}>Bez ocen, testów i podręczników. Za to z dużą ilością rozmów, kreatywności, współpracy i praktycznego działania.</p>
            <Button href="#deklaracja">Zgłoś chęć udziału</Button>
          </Reveal>
        </div>
        <div className={`container ${styles.creatorQuickFacts}`} aria-label="Najważniejsze informacje">
          {quickFacts.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={`section ${styles.creatorLanguage}`}>
        <div className={`container ${styles.creatorLanguageGrid}`}>
          <Reveal>
            <span className="eyebrow">Naturalna komunikacja</span>
            <h2>Angielski, którego naprawdę się używa</h2>
          </Reveal>
          <Reveal className={styles.creatorLanguageCopy}>
            <p>Wszystkie zajęcia będą prowadzone w języku angielskim przez nauczycieli z zagranicy, w tym native speakerów.</p>
            <p>Nie jest to jednak tradycyjny kurs językowy. Angielski będzie naturalnym narzędziem komunikacji podczas wspólnych projektów, dyskusji, nagrywania podcastów czy przygotowywania wystąpień.</p>
            <p>Nie wymagamy perfekcyjnej znajomości języka. Ważniejsze są otwartość, ciekawość i chęć uczestnictwa. Błędy są naturalną częścią nauki, a każdy uczestnik może rozwijać pewność siebie we własnym tempie.</p>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.creatorCourses}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Cztery ścieżki"
            title="Poznaj nasze zajęcia"
            subtitle="Każde zajęcia łączą praktyczne działanie, współpracę i naturalną komunikację po angielsku."
          />
          <div className={styles.creatorCourseGrid}>
            {copy.activities.items.map(course => <CourseCard course={course} key={course.id} />)}
          </div>
        </div>
      </section>

      <section className={`section ${styles.creatorLocations}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Blisko domu"
            title="Kiedy i gdzie się spotykamy?"
            subtitle="Wybierz swoją gminę i sprawdź termin oraz miejsce zajęć."
          />
          <div className={styles.creatorLocationGrid}>
            {projectSchedule.map(location => (
              <Reveal as="article" className={styles.creatorLocationCard} key={location.municipality}>
                <header>
                  <h3>{location.name}</h3>
                  <p className={styles.creatorLocationDay}>{location.day}</p>
                </header>
                <ul className={styles.creatorLocationCourses}>
                  {location.courses.map(course => (
                    <li key={course.activity}>
                      <span>{course.title}</span>
                      {course.time ? <time>{course.time}</time> : <small>Godzina do potwierdzenia</small>}
                    </li>
                  ))}
                </ul>
                {location.venue && location.address ? (
                  <address className={styles.creatorLocationAddress}>
                    <strong>{location.venue}</strong>
                    <span>{location.address}</span>
                  </address>
                ) : (
                  <p className={styles.creatorLocationPending}>Adres sali i dokładne godziny podamy po ich potwierdzeniu.</p>
                )}
              </Reveal>
            ))}
          </div>
          <p className={styles.creatorLocationNote}>Każda grupa liczy maksymalnie <strong>12 uczestników</strong>. Udział w zajęciach jest całkowicie bezpłatny.</p>
        </div>
      </section>

      <section className={`section ${styles.creatorAudience}`}>
        <div className={`container ${styles.creatorAudienceGrid}`}>
          <Reveal>
            <span className="eyebrow">Dla kogo?</span>
            <h2>Zapraszamy młodych ludzi, którzy chcą spróbować czegoś nowego</h2>
            <p>Nie trzeba mieć doświadczenia w przedsiębiorczości, nagrywaniu podcastów ani występach artystycznych. Poziom znajomości angielskiego nie jest kryterium przyjęcia.</p>
          </Reveal>
          <Reveal as="ul" className={styles.creatorAudienceList}>
            {audiencePoints.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.creatorOrganization}`}>
        <div className="container">
          <SectionHeading eyebrow="W skrócie" title="Informacje organizacyjne" />
          <dl className={styles.creatorOrganizationGrid}>
            {organizationFacts.map(([label, value]) => <Reveal as="div" key={label}><dt>{label}</dt><dd>{value}</dd></Reveal>)}
          </dl>
        </div>
      </section>

      <section className={`section ${styles.declaration}`} id="deklaracja">
        <div className="container">
          <header className={styles.declarationIntro}>
            <span className="eyebrow">Zgłoszenia do programu</span>
            <h2>Zgłoś chęć udziału</h2>
            <div className={styles.creatorRegistrationCopy}>
              <p>Obecnie prowadzimy <strong>wstępne zapisy</strong>, które pozwolą nam poznać zainteresowanie poszczególnymi zajęciami i dopasować harmonogram do potrzeb uczestników.</p>
              <p>Liczba miejsc jest ograniczona. Przy spełnieniu kryteriów rekrutacji kolejność zgłoszeń będzie miała znaczenie.</p>
              <p><strong>Wstępne zgłoszenie nie zobowiązuje jeszcze do udziału w projekcie.</strong></p>
            </div>
            <p className={styles.creatorJoin}>🦄 Dołącz do Kreatorów Przyszłości!</p>
          </header>
          <FoundationInterestForm copy={copy.form} locale="pl" />
        </div>
      </section>

      <footer className={styles.creatorGrantNote}>
        <div className="container">
          <p><em>Projekt „Kreatorzy Przyszłości” jest przygotowywany przez uNick Academy Foundation w związku z ubieganiem się o wsparcie w ramach naboru LGD Dolina Samy. Rozpoczęcie zajęć uzależnione jest od zakończenia formalności grantowych. Ostateczny zakres i harmonogram zostaną potwierdzone przed rozpoczęciem realizacji.</em></p>
        </div>
      </footer>
    </>
  )
}
