import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import ConsultationButton from "../components/ConsultationButton";
import Button from "../components/Button";
import CTASection from "../components/CTASection";
import StoryCard from "../components/cards/StoryCard";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Companies",
  description:
    "Communication training for teams and companies — built around how your people actually work, not generic corporate English courses.",
};

const OFFERS = [
  { title: "Group workshops", text: "Small teams, working through real scenarios together — meetings, negotiations, presentations, written communication." },
  { title: "Executive 1:1 coaching", text: "Focused sessions for individuals who need to lead, present or negotiate in English with confidence." },
  { title: "Industry-tailored content", text: "We learn your business — your terminology, your clients, your context — so lessons feel relevant from day one." },
  { title: "Ongoing, not one-off", text: "Regular sessions that build over time, with check-ins so progress is visible to your team and to you." },
];

const PROCESS = [
  { title: "A conversation, first", text: "We start with a free consultation to understand your team, your goals and where communication currently breaks down." },
  { title: "A needs-based plan", text: "We design a programme around your real situations — not a generic syllabus pulled off a shelf." },
  { title: "Lessons that feel human", text: "Same philosophy as the rest of uNick Academy: real conversation, mistakes welcome, genuine connection." },
  { title: "Check-ins & adjustments", text: "We review progress with you and adjust the programme as your team's needs change." },
];

const STORIES = [
  { quote: "Our team stopped avoiding international calls.", who: "Operations Lead", context: "Logistics company, group workshops" },
  { quote: "Our sales team finally sounds like themselves in English — not like they're reading a script.", who: "Head of Sales", context: "SaaS company, ongoing coaching" },
  { quote: "We expected a training course. We got a group of people who actually look forward to Tuesdays.", who: "HR Director", context: "Manufacturing company" },
];

export default function CompaniesPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">For companies</span>
          <h1 className={styles.title}>
            For the team that goes quiet <span className={styles.accent}>on international calls.</span>
          </h1>
          <p className={styles.subtitle}>
            Your people are capable — until a client switches to English and the room tenses up. We build
            communication confidence around how your team actually works, not a generic corporate English
            course.
          </p>
          <div className={styles.actions}>
            <ConsultationButton audience="company" />
            <Button href="/how-we-teach" variant="secondary">
              See how we teach
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia
            kind="video"
            tone="sand"
            ratio="4:3"
            caption="Documentary footage — workplace session, colleagues in real discussion"
          />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">Why it usually doesn't work</span>
            <h2>Most corporate English training teaches vocabulary. The problem is rarely vocabulary.</h2>
            <p>
              Generic courses hand everyone the same materials, regardless of role, confidence level or what
              they actually need English for. People sit through lessons that don&rsquo;t reflect their job —
              and nothing changes when the real call comes.
            </p>
            <p>
              We start by understanding your team: who needs to present, who needs to negotiate, who just needs
              the confidence to speak up in a meeting. Then we build around that.
            </p>
          </Reveal>
          <Reveal as="div" delay={100} className={styles.gallery}>
            <PlaceholderMedia tone="blue" ratio="1:1" caption="Team workshop — working through a real scenario" />
            <PlaceholderMedia tone="red" ratio="1:1" caption="One-to-one coaching session" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="A relaxed, focused group discussion" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="Notes from a tailored session" />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="What we offer" title="Built around your team, not a syllabus" />
          <div className={styles.cardGrid}>
            {OFFERS.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow="How it works" title="From first conversation to lasting change" />
          <div className={styles.stepList}>
            {PROCESS.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 60} className={styles.step}>
                <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.stepTitle}>{item.title}</h3>
                  <p className={styles.stepText}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Stories" title="What teams tell us afterwards" />
          <div className={styles.cardGrid}>
            {STORIES.map((story, i) => (
              <Reveal as="div" key={story.who} delay={i * 70}>
                <StoryCard {...story} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Let's talk about your team."
        subtitle="Book a free consultation — tell us about your team and what 'better communication' would actually look like for you."
        audience="company"
        secondaryHref="/contact"
        secondaryLabel="Contact us"
        showUnicorn={false}
      />
    </>
  );
}
