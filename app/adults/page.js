import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import ConsultationButton from "../components/ConsultationButton";
import Button from "../components/Button";
import CTASection from "../components/CTASection";
import StoryCard from "../components/cards/StoryCard";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Adults",
  description:
    "English for adults who've 'already studied this' for years. Real conversation, flexible formats, and a space where mistakes are simply part of speaking.",
};

const FORMATS = [
  { title: "One-to-one", text: "Fully shaped around you — your goals, your pace, your schedule. Ideal if you want focused, fast progress." },
  { title: "Small groups", text: "A handful of adults at a similar level, talking through real topics together. More conversation, less pressure." },
  { title: "Online or in person", text: "Join from home after work, or come in for the in-person energy — whichever fits your week." },
  { title: "Evenings & weekends", text: "Built around real adult schedules — work, family, life. Lessons fit around you, not the other way round." },
];

const SCENARIOS = [
  { title: "Work & career", text: "Meetings, emails, presentations, interviews — the English that actually shows up in your job." },
  { title: "Travel", text: "Ordering, asking, chatting, getting lost and finding your way back — in conversation, not phrasebooks." },
  { title: "Moving abroad", text: "Settling in, making friends, sorting out 'adult life' admin — in a new language and a new place." },
  { title: "Just for you", text: "Some people learn for no reason beyond curiosity and confidence. That's a good enough reason here." },
];

const STORIES = [
  { quote: "I'd studied English for 15 years and still froze when someone asked me a question. Now I just... answer.", who: "Marek, 41", context: "Adult learner, 1:1" },
  { quote: "I stopped translating in my head sentence by sentence. At some point it just started coming out.", who: "Joanna, 29", context: "Small group, evenings" },
  { quote: "My teacher laughed at my joke — in English. That was the moment something clicked.", who: "Rafał, 52", context: "Adult learner, online" },
];

export default function AdultsPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">For adults</span>
          <h1 className={styles.title}>
            You don&rsquo;t need to be perfect <span className={styles.accent}>to be heard.</span>
          </h1>
          <p className={styles.subtitle}>
            You probably know more English than you think — and less confidence than you deserve. We focus on
            real conversation, real situations, and the simple fact that nobody needs a perfect accent to be
            understood.
          </p>
          <div className={styles.actions}>
            <ConsultationButton audience="adult" />
            <Button href="/how-we-teach" variant="secondary">
              See how we teach
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia
            kind="video"
            tone="cream"
            ratio="4:3"
            caption="Documentary footage — adult learners in relaxed conversation"
          />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            <PlaceholderMedia tone="blue" ratio="1:1" caption="Evening class — coffee, conversation, no pressure" />
            <PlaceholderMedia tone="red" ratio="1:1" caption="One-to-one session, focused and unhurried" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="Online lesson — same warmth, different room" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="A genuine laugh mid-lesson" />
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">Why adults get stuck</span>
            <h2>It&rsquo;s rarely about knowledge. It&rsquo;s about the pause before speaking.</h2>
            <p>
              Most adult learners we meet have studied English for years — at school, in courses, through apps.
              The grammar is often in there somewhere. What&rsquo;s missing is the split second of courage it
              takes to say the sentence out loud, imperfect as it might be.
            </p>
            <p>
              So our lessons are built around talking — a lot. Not reciting. Not drilling. Talking, about things
              that matter to you, with someone who's listening to what you mean, not just how you say it.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Learning that fits your life"
            title="However you learn best, there's a format for it"
          />
          <div className={styles.cardGrid}>
            {FORMATS.map((item, i) => (
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
          <SectionHeading
            eyebrow="What people use it for"
            title="The English you'll actually need"
            subtitle="We start from your real life, not a unit in a textbook."
          />
          <div className={styles.cardGrid}>
            {SCENARIOS.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Stories" title="Moments that stuck with us" />
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
        title="Ready to stop pausing before you speak?"
        subtitle="Book a free consultation — we'll talk about where you are, and where you'd like to get to."
        audience="adult"
        secondaryHref="/meet-us"
        secondaryLabel="Meet the team"
      />
    </>
  );
}
