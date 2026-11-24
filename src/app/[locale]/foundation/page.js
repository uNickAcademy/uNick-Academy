import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import { getDictionary } from '../../lib/dictionaries'
import { buildMetadata } from '../../lib/seo'
import { foundationConfig, siteConfig } from '../../lib/site-config'
import styles from './FoundationPage.module.css'

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'pl') {
    return {
      title: 'uNick Academy Foundation',
      robots: { index: false, follow: false },
      alternates: { canonical: '/pl/foundation' },
    }
  }

  const copy = getDictionary('pl').foundation
  return buildMetadata({
    locale,
    path: '/foundation',
    title: copy.meta.title,
    description: copy.meta.description,
    availableLocales: ['pl'],
  })
}

const projects = [
  {
    id: 'deklaracja',
    href: '/creators',
    image: '/foundation/kreatorzy-przyszlosci-card-v2.png',
    width: 1122,
    height: 1402,
    alt: 'Kreatorzy Przyszłości – bezpłatne zajęcia',
    title: 'Kreatorzy Przyszłości',
    subtitle: 'Bezpłatne zajęcia dla młodzieży',
    tone: 'cream',
    cta: 'Dowiedz się więcej',
    position: 'right center',
  },
  {
    id: 'ferie',
    href: '/ferie',
    image: '/foundation/winter-project-week-2027.webp',
    width: 1414,
    height: 2000,
    alt: 'Plakat Winter Project Week – Kreatywne ferie po angielsku, 22–26 lutego 2027',
    title: 'Winter Project Week',
    subtitle: 'Ferie z pomysłem · 22–26 lutego 2027',
    tone: 'navy',
    cta: 'Zapisz się na ferie',
    position: 'center center',
  },
]

export default async function Page({ params }) {
  const { locale } = await params
  if (locale !== 'pl') redirect('/pl/foundation')

  const copy = getDictionary('pl').foundation
  const foundation = foundationConfig
  const url = `${siteConfig.url}/pl/foundation`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'NGO',
              '@id': `${url}#foundation`,
              name: foundation.name,
              legalName: foundation.legalName,
              url,
              taxID: foundation.nip,
            },
            {
              '@type': 'WebPage',
              url,
              name: copy.meta.title,
              description: copy.meta.description,
              inLanguage: 'pl-PL',
              about: { '@id': `${url}#foundation` },
            },
          ],
        }}
      />

      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <Reveal className={styles.heroCopy}>
            <h1>
              <span className={styles.brandAccent}>uNick</span> Academy Foundation
            </h1>
            <p className={styles.lead}>{copy.hero.subtitle}</p>
            {copy.hero.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </Reveal>
          <Reveal className={styles.heroMascot}>
            <Image
              src="/unicorn.PNG"
              alt="uNickorn machający na powitanie"
              width={1024}
              height={1536}
              priority
              sizes="(max-width: 850px) 260px, (max-width: 1200px) 34vw, 420px"
            />
          </Reveal>
        </div>
      </section>

      <section className={styles.projectChooser} aria-labelledby="foundation-projects-title">
        <div className="container">
          <h2 id="foundation-projects-title" className="visually-hidden">Projekty Fundacji</h2>
          <div className={styles.projectCards}>
            {projects.map((project) => (
              <Reveal as="article" id={project.id} className={styles.projectCard} key={project.href}>
                <Link href={project.href} className={styles.projectCardLink} aria-label={`${project.cta}: ${project.title}`}>
                  <span className={styles.projectCardMedia}>
                    <Image
                      src={project.image}
                      alt={project.alt}
                      width={project.width}
                      height={project.height}
                      sizes="(max-width: 760px) 92vw, 46vw"
                      style={{ objectPosition: project.position }}
                    />
                  </span>
                  <span className={`${styles.projectCardBody} ${styles[`projectCardBody_${project.tone}`]}`}>
                    <span className={styles.projectCardTitle}>{project.title}</span>
                    <span className={styles.projectCardSubtitle}>{project.subtitle}</span>
                    <span className={styles.projectCardCta}>
                      {project.cta} <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.foundationDetails} aria-labelledby="foundation-details-title">
        <div className="container">
          <Reveal>
            <aside className={styles.identity}>
              <small id="foundation-details-title">Dane Fundacji</small>
              <h3>{foundation.legalName}</h3>
              <dl>
                <div><dt>KRS</dt><dd>{foundation.krs}</dd></div>
                <div><dt>NIP</dt><dd>{foundation.nip}</dd></div>
                <div><dt>REGON</dt><dd>{foundation.regon}</dd></div>
                <div><dt>Forma prawna</dt><dd>{foundation.legalForm}</dd></div>
                <div><dt>Data rejestracji</dt><dd>{foundation.registrationDate}</dd></div>
              </dl>
              <p>
                {foundation.address.streetAddress}, {foundation.address.village},{' '}
                {foundation.address.postalCode} {foundation.address.addressLocality},{' '}
                {foundation.address.addressCountry}
              </p>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  )
}
