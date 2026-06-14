import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import ConsultationButton from "../components/ConsultationButton";
import CTASection from "../components/CTASection";
import PrincipleCard from "../components/cards/PrincipleCard";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "How We Teach",
  description:
    "Our teaching philosophy: communication over perfection, real conversations, curiosity, culture, individual attention, immersion, warmth and humour.",
};

const PRINCIPLES = [
  {
    icon: "chat",
    title: "Communication over perfection",
    text: "Being understood matters more than being flawless. We'd rather you say something imperfectly than say nothing at all — fluency grows from use, not from waiting until you're 'ready'.",
  },
  {
    icon: "mic",
    title: "Real conversations",
    text: "From the first lesson, you're talking about real things — your day, your opinions, your life — not reciting dialogues about people who don't exist.",
  },
  {
    icon: "book",
    title: "Context before rules",
    text: "We introduce language the way it actually shows up — in a story, a situation, a conversation — and let the rules emerge from that. Grammar makes more sense once you've felt it in use.",
  },
  {
    icon: "spark",
    title: "Curiosity over memorisation",
    text: "Questions matter more than answers learned by heart. We'd rather you ask 'why is it like that?' than memorise a rule you don't understand.",
  },
  {
    icon: "globe",
    title: "Culture and connection",
    text: "Language doesn't exist in a vacuum. Our teachers bring their countries, humour and perspectives into every lesson — so you're learning about people, not just words.",
  },
  {
    icon: "target",
    title: "Individual approach",
    text: "No two students learn the same way. We pay attention to how you think, what motivates you, and what's getting in your way — and adjust accordingly.",
  },
  {
    icon: "compass",
    title: "Immersion",
    text: "The more English surrounds you — in conversation, in stories, in everyday moments of a lesson — the more naturally it becomes part of how you think, not just what you study.",
  },
  {
    icon: "heart",
    title: "Warmth",
    text: "You're a person first, a student second. Every lesson starts from a place of care — because people open up, take risks and learn best when they feel safe.",
  },
  {
    icon: "smile",
    title: "Humour",
    text: "If you're laughing, you're relaxed — and relaxed people learn faster. We don't take ourselves too seriously, even when the subject matter is.",
  },
];

export default function HowWeTeachPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">How we teach</span>
          <h1 className={styles.title}>
            A philosophy, <span className={styles.accent}>not a method.</span>
          </h1>
          <p className={styles.subtitle}>
            We don&rsquo;t follow a single textbook or a rigid system. Instead, every lesson — for a five-year-old
            or a fifty-person company — is shaped by the same set of beliefs about how people actually learn to
            communicate.
          </p>
          <div className={styles.actions}>
            <ConsultationButton />
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia
            kind="video"
            tone="blue"
            ratio="4:3"
            caption="Documentary footage — a lesson in progress, teacher and student in conversation"
          />
        </Reveal>
      </div>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our principles"
            title="What guides every lesson"
            subtitle="Nine ideas, applied consistently — whether you're seven or seventy, learning alone or as part of a team."
          />
          <div>
            {PRINCIPLES.map((p, i) => (
              <Reveal as="div" key={p.title} delay={Math.min(i * 50, 300)}>
                <PrincipleCard {...p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            <PlaceholderMedia tone="red" ratio="1:1" caption="A lesson built around a real story, not a worksheet" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="Mixed ages, one conversation" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="A teacher pausing to listen, not to correct" />
            <PlaceholderMedia tone="blue" ratio="1:1" caption="Laughter, mid-lesson" />
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">In practice</span>
            <h2>What this actually looks like in the room</h2>
            <p>
              A children&rsquo;s class might start with a story and end with a made-up game. A business workshop
              might start with a real email someone needs to send tomorrow. An adult 1:1 might spend twenty
              minutes on a single, slightly awkward conversation from someone&rsquo;s week — because that&rsquo;s
              where the learning actually lives.
            </p>
            <p>
              Across all of it, the thread is the same: real people, real situations, real conversation — with
              enough warmth and humour that getting things wrong stops feeling like a risk.
            </p>
          </Reveal>
        </div>
      </section>

      <CTASection
        title="Curious how this would work for you?"
        subtitle="Book a free consultation and we'll talk through what a lesson would actually look like — for you, your child, or your team."
      />
    </>
  );
}
