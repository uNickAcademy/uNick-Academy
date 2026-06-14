import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import ValueCard from "../cards/ValueCard";
import Icon from "../Icon";
import styles from "./Differentiators.module.css";

const ITEMS = [
  {
    icon: "globe",
    title: "People from around the world",
    description:
      "Our teachers come from different countries and cultures. Every lesson carries a little of their world with it — accents, stories, humour and all.",
  },
  {
    icon: "mic",
    title: "Speaking from day one",
    description:
      "You won't wait until you're 'ready'. From your very first lesson, you're in conversation — because that's how confidence actually grows.",
  },
  {
    icon: "heart",
    title: "Mistakes are welcome",
    description:
      "We don't flinch at wrong words or messy grammar. Mistakes mean you're trying — and trying is the whole point. We celebrate the courage to speak.",
  },
  {
    icon: "puzzle",
    title: "A home for people who never fit in",
    description:
      "Many of our students never felt comfortable in traditional education — including children with ADHD, anxious adults and teenagers finding their voice. Here, that's normal.",
  },
];

export default function Differentiators() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="What makes us different"
          title="Not your typical language school"
          subtitle="Four things you'll notice from the very first conversation."
        />
        <div className={styles.grid}>
          {ITEMS.map((item, i) => (
            <Reveal as="div" key={item.title} delay={i * 80}>
              <ValueCard icon={<Icon name={item.icon} />} title={item.title} description={item.description} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
