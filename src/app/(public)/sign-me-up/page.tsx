import type { Metadata } from 'next'
import { SignMeUpForm } from './SignMeUpForm'
import { TrustStrip, FeaturedProof } from '../zapisy/SocialProof'

export const metadata: Metadata = {
  title: 'Zgłoś się na angielski — uNick Academy',
  description: 'Zostaw imię i numer, oddzwonimy w ciągu jednego dnia roboczego. Angielski w Rumianku koło Tarnowa Podgórnego i online, dla dzieci, nastolatków, dorosłych i firm.',
  alternates: { canonical: '/sign-me-up' },
}

export default function SignMeUpPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-black text-gray-900 sm:text-4xl">
            Zostaw numer, oddzwonimy
          </h1>
          <p className="text-base leading-relaxed text-gray-500">
            Nie musisz teraz wybierać grupy, poziomu ani terminu. Powiedz nam, dla kogo
            szukacie zajęć, a resztę ustalimy w rozmowie.
          </p>
        </div>

        <SignMeUpForm />

        <TrustStrip />
        <FeaturedProof />
      </div>
    </div>
  )
}
