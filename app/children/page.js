import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import UNickorn from "../components/UNickorn";
import ConsultationButton from "../components/ConsultationButton";
import Button from "../components/Button";
import CTASection from "../components/CTASection";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Children",
  description:
    "English lessons for children who learn differently — including kids with ADHD, anxious children and curious minds who never fitted the traditional classroom mould.",
};

const REASSURANCES = [
  {
    title: "“My child can't sit still.”",
    text: "Good. Our lessons aren't built around sitting still — they're built around talking, moving, playing and discovering. Energy is welcome here.",
  },
  {
    title: "“My child has ADHD / anxiety.”",
    text: "Many of our students do. Small groups, patient teachers and zero judgement mean your child is met where they are — not where a textbook says they should be.",
  },
  {
    title: "“My child is shy in groups.”",
    text: "We start gently — listening, playing, joining in at their own pace. Confidence grows from feeling safe, not from being pushed.",
  },
];

const DAY = [
  {
    time: "First 5 minutes",
    title: "A proper hello",
    text: "Every lesson starts the same way — by name, with a smile, and a question about their day. No diving straight into a textbook.",
  },
  {
    time: "Warm-up",
    title: "Play with sound",
    text: "Songs, rhymes, silly voices — children absorb rhythm and pronunciation long before they can explain a grammar rule.",
  },
  {
    time: "Main activity",
    title: "A reason to talk",
    text: "A game, a story, a mission to complete together. English becomes the tool to do something fun — not the subject of the lesson itself.",
  },
  {
    time: "Closing moment",
    title: "A small win, noticed",
    text: "Every child leaves having been seen for something they did well — sometimes with a visit from uNickorn to celebrate it.",
  },
];

export default function ChildrenPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">For children</span>
          <h1 className={styles.title}>
            The classroom where it&rsquo;s OK to be <span className={styles.accent}>loud, curious</span> and a
            little different.
          </h1>
          <p className={styles.subtitle}>
            Some children don&rsquo;t thrive sitting still and repeating after the teacher — and that&rsquo;s
            completely fine. At uNick Academy, children learn English the way they actually learn anything:
            through play, stories, movement and real conversation.
          </p>
          <div className={styles.actions}>
            <ConsultationButton audience="child" />
            <Button href="#a-day" variant="secondary">
              See a day in class
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia
            kind="video"
            tone="red"
            ratio="4:3"
            caption="Documentary footage — children's group, mid-game, genuine laughter"
          />
          <UNickorn variant="trophy" size={84} className={styles.unicornCorner} float />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            <PlaceholderMedia tone="blue" ratio="1:1" caption="A child explaining their drawing in English" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="Small group, big table, lots of talking" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="Hands-on activity — building vocabulary by doing" />
            <PlaceholderMedia tone="red" ratio="1:1" caption="A proud moment, captured candidly" />
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">Every child learns differently</span>
            <h2>We don&rsquo;t ask children to fit the lesson. We shape the lesson around them.</h2>
            <p>
              Groups are small on purpose. Teachers notice who needs quiet encouragement, who needs a challenge,
              and who just needs to move around for five minutes before they can focus again.
            </p>
            <p>
              English becomes the language of games, jokes, stories and small missions — not a subject to get
              through. Children stop performing for a grade and start communicating because they want to be
              understood.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" id="a-day">
        <div className="container">
          <SectionHeading
            eyebrow="A day in a children's class"
            title="What actually happens in the room"
            subtitle="No worksheets-first. Here's the rhythm of a typical lesson."
          />
          <div className={styles.timeline}>
            {DAY.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 60} className={styles.timelineItem}>
                <span className={styles.timelineTime}>{item.time}</span>
                <div>
                  <h3 className={styles.timelineTitle}>{item.title}</h3>
                  <p className={styles.timelineText}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading
            eyebrow="For parents"
            title="The questions every parent asks us"
            subtitle="Honest answers, from people who've heard it all before."
          />
          <div className={styles.cardGrid}>
            {REASSURANCES.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 80} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Curious if it's the right fit?"
        subtitle="Book a free consultation and we'll talk about your child — not just their English level."
        audience="child"
        secondaryHref="/how-we-teach"
        secondaryLabel="See how we teach"
      />
    </>
  );
}
