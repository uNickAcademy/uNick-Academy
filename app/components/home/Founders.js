import Reveal from "../Reveal";
import Button from "../Button";
import PlaceholderMedia from "../PlaceholderMedia";
import styles from "./Founders.module.css";

export default function Founders() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal as="div" className={styles.gallery}>
          <PlaceholderMedia
            className={styles.galleryMain}
            tone="blue"
            ratio="3:4"
            caption="Milena & Nick, at the table where it all began"
          />
          <PlaceholderMedia tone="cream" ratio="1:1" caption="Early lessons, before uNick had a name" />
          <PlaceholderMedia tone="sand" ratio="1:1" caption="A classroom that feels like a living room" />
        </Reveal>

        <Reveal as="div" delay={120} className={styles.copy}>
          <span className="eyebrow">Our story</span>
          <h2 className={styles.title}>
            We didn&rsquo;t build another language school.
            <br />
            We built the place we wished had existed.
          </h2>
          <p>
            Milena grew up in Poland, learning English through rules, red pens and
            the constant fear of getting it wrong. Nick grew up in England,
            watching people freeze the moment a conversation needed courage rather
            than correctness. They met somewhere in between — and realised they
            were tired of the same story everywhere: clever people, silenced by
            the idea that language has to be perfect before it counts.
          </p>
          <p>
            So they started uNick Academy around a kitchen table, with one rule:
            real conversation first, everything else second. No judgement for
            mistakes. No shame for accents. No one left out because they learn
            differently. What began as a handful of lessons between friends grew
            into a small, international academy — still run the same way, by
            people who actually know your name.
          </p>
          <p className={styles.signature}>— Milena &amp; Nick, founders</p>
          <Button href="/meet-us" variant="ghost">
            Read the full story
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
