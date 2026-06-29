import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import StoryCard from "../cards/StoryCard";
import styles from "./Stories.module.css";

export default function Stories({ dict }) {
  const t = dict.home.stories;

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className={styles.grid}>
          {t.items.map((story, i) => (
            <Reveal as="div" key={story.quote} delay={i * 70}>
              <StoryCard {...story} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
