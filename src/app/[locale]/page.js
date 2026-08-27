import Hero from "../components/home/Hero";
import Founders from "../components/home/Founders";
import Differentiators from "../components/home/Differentiators";
import ChoosePath from "../components/home/ChoosePath";
import HowWeTeachPreview from "../components/home/HowWeTeachPreview";
import MeetPeople from "../components/home/MeetPeople";
import Stories from "../components/home/Stories";
import Manifesto from "../components/home/Manifesto";
import CTASection from "../components/CTASection";
// TYMCZASOWE (nabór wrzesień 2026) — usuń te importy razem z <AvailabilityBanner/>
// i <AvailabilityPopup/> poniżej.
import AvailabilityBanner from "../components/availability/AvailabilityBanner";
import AvailabilityPopup from "../components/availability/AvailabilityPopup";
import LocationSection from "../components/LocationSection";
import { getDictionary } from "../lib/dictionaries";

// Strona jest prerenderowana, a tymczasowy pasek naboru ma zniknąć sam po
// 7.09.2026 — bez odświeżania wisiałby dalej. Usuń razem z banerem.
export const revalidate = 3600;

export default async function HomePage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      {/* TYMCZASOWE (nabór wrzesień 2026) — dwie linijki do skasowania. */}
      <AvailabilityBanner locale={locale} />
      <AvailabilityPopup locale={locale} />
      <Hero dict={dict} locale={locale} />
      <Founders dict={dict} locale={locale} />
      <Differentiators dict={dict} />
      <ChoosePath dict={dict} locale={locale} />
      <HowWeTeachPreview dict={dict} locale={locale} />
      <MeetPeople dict={dict} locale={locale} />
      <Stories dict={dict} />
      <LocationSection dict={dict} locale={locale} />
      <Manifesto dict={dict} />
      <CTASection
        title={dict.home.finalCta.title}
        subtitle={dict.home.finalCta.subtitle}
        signupHref="/zapisy"
        signupLabel={dict.common.buttons.signUp}
      />
    </>
  );
}
