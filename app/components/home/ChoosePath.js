import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import PathCard from "../cards/PathCard";
import styles from "./ChoosePath.module.css";

const PATHS = [
  {
    kicker: "Children",
    title: "For the kid who asks “why?” about everything",
    text: "Some children don't thrive sitting still and repeating after the teacher. Ours get to move, play, ask questions and be a little loud — while English quietly becomes part of how they think.",
    href: "/children",
    mediaCaption: "Children's class — a small group, building something together",
    tone: "red",
  },
  {
    kicker: "Teenagers",
    title: "For the teen who has opinions — just not in English yet",
    text: "Exams, social pressure, the fear of sounding silly in front of others. We help teenagers say what they actually mean, in a room where no one is keeping score.",
    href: "/teenagers",
    mediaCaption: "Teen group — real discussion, not a worksheet in sight",
    tone: "blue",
  },
  {
    kicker: "Adults",
    title: "For the adult who's “already studied this” for years",
    text: "You know more grammar than you think. What's missing is the courage to use it. We focus on real situations — work, travel, relationships — so the words finally come when you need them.",
    href: "/adults",
    mediaCaption: "Adult learners — a relaxed conversation that just happens to be in English",
    tone: "cream",
  },
  {
    kicker: "Companies",
    title: "For the team that goes quiet on international calls",
    text: "Your people are capable — until a client switches to English and the room tenses up. We build communication confidence around how your team actually works.",
    href: "/companies",
    mediaCaption: "Workplace session — colleagues practising a real scenario together",
    tone: "sand",
  },
];

export default function ChoosePath() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Choose your path"
          title="Why is this for me?"
          subtitle="However you arrive — as a parent, a student, or a business — there's a way in that's built around you."
        />
        <div className={styles.grid}>
          {PATHS.map((path, i) => (
            <Reveal as="div" key={path.href} delay={i * 70}>
              <PathCard {...path} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
