import Reveal from "../components/Reveal";
import SectionHeading from "../components/SectionHeading";
import PlaceholderMedia from "../components/PlaceholderMedia";
import ConsultationButton from "../components/ConsultationButton";
import CTASection from "../components/CTASection";
import TeacherCard from "../components/cards/TeacherCard";
import { teachers } from "../lib/teachers";
import styles from "../components/sections.module.css";

export const metadata = {
  title: "Meet Us",
  description:
    "The people behind uNick Academy — founders Milena and Nick, and the international team of teachers who bring the academy to life.",
};

const LOOK_FOR = [
  { title: "They actually like people", text: "Subject knowledge can be taught. Genuine warmth towards students can't — so we look for it first." },
  { title: "They've been the outsider too", text: "Many of our teachers know what it's like to feel out of place in a classroom, a country, or a language. It shows in how they teach." },
  { title: "They can laugh at themselves", text: "Teachers who take themselves too seriously make students afraid to make mistakes. Ours don't." },
  { title: "They keep learning too", text: "Our best teachers are still curious — about language, about people, about how to explain things better." },
];

export default function MeetUsPage() {
  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">Meet us</span>
          <h1 className={styles.title}>
            The family behind <span className={styles.accent}>the table.</span>
          </h1>
          <p className={styles.subtitle}>
            uNick Academy started as two people who believed language should bring people together, not sort
            them into who&rsquo;s good enough and who isn&rsquo;t. Here&rsquo;s who we are — and who you&rsquo;ll
            actually be learning with.
          </p>
          <div className={styles.actions}>
            <ConsultationButton />
          </div>
        </Reveal>
        <Reveal as="div" delay={120} className={styles.media}>
          <PlaceholderMedia tone="cream" ratio="4:3" caption="Milena and Nick, at the table where it all began" />
        </Reveal>
      </div>

      <section className={`section ${styles.altSection}`}>
        <div className={`container ${styles.split}`}>
          <Reveal as="div" className={styles.gallery}>
            <PlaceholderMedia tone="blue" ratio="1:1" caption="Milena, early teaching days" />
            <PlaceholderMedia tone="red" ratio="1:1" caption="Nick, early teaching days" />
            <PlaceholderMedia tone="sand" ratio="1:1" caption="The first 'classroom' — a kitchen table" />
            <PlaceholderMedia tone="cream" ratio="1:1" caption="uNick Academy today — still the same spirit" />
          </Reveal>
          <Reveal as="div" delay={100} className={styles.copy}>
            <span className="eyebrow">Our story, in full</span>
            <h2>Two people, two countries, one frustration</h2>
            <p>
              Milena grew up in Poland in classrooms where English was something you were tested on, not
              something you used. Nick grew up in England, surrounded by people who&rsquo;d studied languages
              for years and still couldn&rsquo;t hold a conversation when it mattered.
            </p>
            <p>
              When they met, they realised they&rsquo;d been seeing the same problem from opposite sides: schools
              that taught language as a subject to be examined, rather than a skill to be lived. People who knew
              the rules but froze the moment a real conversation needed courage.
            </p>
            <p>
              uNick Academy began small — a few lessons, a shared belief that mistakes are part of speaking, not
              a failure of it. It&rsquo;s grown since, but the rule hasn&rsquo;t changed: every student is a
              person first, with a story worth hearing — not just a level to move up.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our team"
            title="Teachers from around the world"
            subtitle="Different countries, accents and personalities — all genuinely invested in you. Hover-worthy CVs aren't the point; these people are."
          />
          <div className={styles.cardGrid}>
            {teachers.map((teacher, i) => (
              <Reveal as="div" key={teacher.name} delay={Math.min(i * 60, 300)}>
                <TeacherCard {...teacher} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow="Joining the team" title="What we look for in a teacher" />
          <div className={styles.cardGrid}>
            {LOOK_FOR.map((item, i) => (
              <Reveal as="div" key={item.title} delay={i * 70} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to meet us in person?"
        subtitle="Book a free consultation — the easiest way to get a feel for who we are."
      />
    </>
  );
}
