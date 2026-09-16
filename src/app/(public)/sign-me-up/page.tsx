import type { Metadata } from 'next'
import Image from 'next/image'
import UNickorn from '@/app/components/UNickorn'
import { SignMeUpForm } from './SignMeUpForm'
import styles from './SignMeUp.module.css'

export const metadata: Metadata = {
  title: 'Zgłoś chęć udziału w zajęciach — uNick Academy',
  description: 'Powiedz nam, że chcecie chodzić na angielski, a my oddzwonimy i ustalimy resztę. Rumianek koło Tarnowa Podgórnego i online, dla dzieci, nastolatków, dorosłych i firm.',
  alternates: { canonical: '/sign-me-up' },
}

export default function SignMeUpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <Image
          src="/availability/banner.jpg"
          alt="uNickorn, maskotka uNick Academy, w klasie językowej"
          width={2172}
          height={724}
          priority
          sizes="100vw"
          className={styles.bannerImage}
        />
      </div>

      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Rok szkolny 2026/2027</span>
            <h1 className={styles.title}>
              Zgłoś chęć udziału <span className={styles.accent}>w zajęciach</span>
            </h1>
            <p className={styles.lead}>
              Nie musisz teraz wybierać grupy, poziomu ani terminu. Daj nam znać, że
              chcecie chodzić na angielski, a my oddzwonimy i ustalimy resztę w rozmowie.
            </p>
            <p className={styles.meta}>
              Trzy pola wystarczą. Odezwiemy się w ciągu jednego dnia roboczego.
            </p>
          </div>
          <div className={styles.mascot}>
            <span className={styles.floating}>
              <UNickorn variant="wave" size={170} />
            </span>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.container}>
          <SignMeUpForm />
        </div>
      </section>
    </div>
  )
}
