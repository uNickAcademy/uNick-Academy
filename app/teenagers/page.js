import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import ConsultationButton from "../components/ConsultationButton";
import Button from "../components/Button";
import CTASection from "../components/CTASection";
import TeacherCard from "../components/cards/TeacherCard";
import { teachers } from "../lib/teachers";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Teenagers",
  description:
    "English for teenagers who have plenty to say — just not always in English yet. Real conversations about real topics, without the fear of getting it wrong.",
};

const TOPICS = [
  { title: "What's actually going on", text: "Current events, social media, the things your friends are talking about — discussed properly, in English." },
  { title: "Who you're becoming", text: "Plans, doubts, opinions about the future. The kind of conversation that's hard enough in your first language." },
  { title: "Things you're into", text: "Gaming, music, sport, shows — whatever you'd talk about anyway, just with new words for it." },
  { title: "Exams, without the panic", text: "If exams matter to you, we'll prepare you properly — but never at the cost of being able to actually speak." },
];

const FINDING_VOICE = [
  { time: "Week one", title: "Permission to be imperfect", text: "We set the tone early: nobody here is grading your accent or judging your grammar mid-sentence." },
  { time: "Early weeks", title: "Low-stakes speaking, often", text: "Short, frequent chances to talk — about opinions, not just facts — so speaking stops feeling like a performance." },
  { time: "Ongoing", title: "Real disagreement, welcomed", text: "We want you to push back, argue, change your mind out loud. That's fluency — not reciting answers." },
  { time: "Over time", title: "Your own voice, in English", text: "Not a textbook voice. Yours — your humour, your opinions, your way of explaining things." },
];

export default function TeenagersPage() {
  const teenTeachers = teachers.filter((t) => t.role.toLowerCase().includes("teen")).slice(0, 2);

  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">For teenagers</span>
          <h1 className={styles.title}>
            You already have opinions. <span className={styles.accent}>Let's get them into English.</span>
          </h1>
          <p className={styles.subtitle}>
            School English can feel like a performance — answer correctly, don't get picked on, don't sound
            stupid. We do the opposite. Small groups, real topics, and a room where being wrong out loud is
            completely normal.
          </p>
          <div className={styles.actions}>
            <ConsultationButton audience="teen" />
            <Button href="/how-we-teach" variant="secondary">
              See how we teach
            </Button>
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia
            kind="video"
            tone="blue"
            ratio="4:3"
            caption="Documentary footage — teen group mid-debate, genuinely engaged"
          />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.copy}>
            <span className="eyebrow">Real talk</span>
            <h2>Most teenagers don&rsquo;t need more grammar. They need more nerve.</h2>
            <p>
              By the time most teenagers reach us, they&rsquo;ve already studied English for years. They can
              conjugate verbs they&rsquo;ll never say out loud. What&rsquo;s missing isn&rsquo;t knowledge —
              it&rsquo;s the confidence to use it without freezing up.
            </p>
            <p>
              So we flip the priority. Conversation first. Confidence first. The grammar catches up — it always
              does, once speaking stops feeling dangerous.
            </p>
          </Reveal>
          <Reveal as="div" delay={100} className={styles.gallery}>
            <PlaceholderMedia tone="red" ratio="1:1" caption="Group discussion — opinions, not worksheets" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="A teenager mid-sentence, completely at ease" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="Casual setup — more living room than classroom" />
            <PlaceholderMedia tone="blue" ratio="1:1" caption="Teacher listening, not correcting every word" />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What we actually talk about"
            title="Topics worth having an opinion on"
            subtitle="Conversation only works if there's something real to say. Here's the kind of thing that comes up."
          />
          <div className={styles.cardGrid}>
            {TOPICS.map((item, i) => (
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
            eyebrow="Speak before you're ready"
            title="How confidence actually builds"
            subtitle="It's not a switch that flips. It's a process — and we know exactly what it looks like."
          />
          <div className={styles.timeline}>
            {FINDING_VOICE.map((item, i) => (
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

      {teenTeachers.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading
              eyebrow="Teachers who get it"
              title="People who remember being the quiet one"
              center
            />
            <div className={styles.cardGrid}>
              {teenTeachers.map((teacher, i) => (
                <Reveal as="div" key={teacher.name} delay={i * 80}>
                  <TeacherCard {...teacher} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        title="Ready to actually use your English?"
        subtitle="Book a free consultation — no pressure, just a conversation about where you're at and where you'd like to go."
        audience="teen"
        secondaryHref="/meet-us"
        secondaryLabel="Meet the team"
        showUnicorn={false}
      />
    </>
  );
}
