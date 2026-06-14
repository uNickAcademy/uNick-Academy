import Hero from "./components/home/Hero";
import Founders from "./components/home/Founders";
import Differentiators from "./components/home/Differentiators";
import ChoosePath from "./components/home/ChoosePath";
import HowWeTeachPreview from "./components/home/HowWeTeachPreview";
import MeetPeople from "./components/home/MeetPeople";
import Stories from "./components/home/Stories";
import Manifesto from "./components/home/Manifesto";
import CTASection from "./components/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Founders />
      <Differentiators />
      <ChoosePath />
      <HowWeTeachPreview />
      <MeetPeople />
      <Stories />
      <Manifesto />
      <CTASection
        title="Ready to start speaking?"
        subtitle="Tell us who you are. We’ll help you find your people."
      />
    </>
  );
}
