import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import StoryCard from "../cards/StoryCard";
import styles from "./Stories.module.css";

const STORIES = [
  {
    quote: "I finally started speaking.",
    who: "Aleksandra, 34",
    context: "Adult learner, 8 months at uNick",
  },
  {
    quote: "My child asks when English day is.",
    who: "Parent of Zosia, age 7",
    context: "Children's group",
  },
  {
    quote: "Our team stopped avoiding international calls.",
    who: "Operations Lead, logistics company",
    context: "Company programme",
  },
  {
    quote: "I used to dread being picked to answer. Now I'm the one who won't stop talking.",
    who: "Kuba, 15",
    context: "Teenager, conversation group",
  },
];

export default function Stories() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <SectionHeading
          eyebrow="Stories"
          title="Not testimonials. Transformations."
          subtitle="These are the moments that tell us we're doing something right."
        />
        <div className={styles.grid}>
          {STORIES.map((story, i) => (
            <Reveal as="div" key={story.quote} delay={i * 70}>
              <StoryCard {...story} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
