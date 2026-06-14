import Hero from "../components/home/Hero";
import Founders from "../components/home/Founders";
import Differentiators from "../components/home/Differentiators";
import ChoosePath from "../components/home/ChoosePath";
import HowWeTeachPreview from "../components/home/HowWeTeachPreview";
import MeetPeople from "../components/home/MeetPeople";
import Stories from "../components/home/Stories";
import Manifesto from "../components/home/Manifesto";
import CTASection from "../components/CTASection";
import { getDictionary } from "../lib/dictionaries";

export default async function HomePage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <Hero dict={dict} locale={locale} />
      <Founders dict={dict} locale={locale} />
      <Differentiators dict={dict} />
      <ChoosePath dict={dict} locale={locale} />
      <HowWeTeachPreview dict={dict} locale={locale} />
      <MeetPeople dict={dict} locale={locale} />
      <Stories dict={dict} />
      <Manifesto dict={dict} />
      <CTASection title={dict.home.finalCta.title} subtitle={dict.home.finalCta.subtitle} />
    </>
  );
}
