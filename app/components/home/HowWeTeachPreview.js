import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import Button from "../Button";
import PrincipleCard from "../cards/PrincipleCard";
import styles from "./HowWeTeachPreview.module.css";

const PRINCIPLES = [
  { icon: "chat", title: "Communication over perfection", text: "Being understood matters more than being flawless." },
  { icon: "mic", title: "Real conversations", text: "From day one, you talk about real things — not scripts." },
  { icon: "spark", title: "Curiosity over memorisation", text: "Questions matter more than answers learned by heart." },
  { icon: "globe", title: "Culture and connection", text: "Language carries people, places and stories with it." },
  { icon: "heart", title: "Warmth", text: "You're a person first, a student second. Always." },
  { icon: "smile", title: "Humour", text: "If you're laughing, you're relaxed — and learning." },
];

export default function HowWeTeachPreview() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.layout}`}>
        <Reveal as="div">
          <SectionHeading
            eyebrow="How we teach"
            title="A philosophy, not a method"
            subtitle="No textbook dictates our lessons. These ideas do — in every class, with every student, every time."
          />
          <Button href="/how-we-teach" variant="ghost">
            See the full philosophy
          </Button>
        </Reveal>

        <div className={styles.grid}>
          {PRINCIPLES.map((p, i) => (
            <Reveal as="div" key={p.title} delay={i * 60}>
              <PrincipleCard {...p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
