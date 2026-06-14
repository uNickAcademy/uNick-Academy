import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import Button from "../Button";
import TeacherCard from "../cards/TeacherCard";
import { teachers } from "../../lib/teachers";
import styles from "./MeetPeople.module.css";

export default function MeetPeople() {
  const featured = teachers.slice(0, 4);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Meet our people"
          title="Teachers, not just CVs"
          subtitle="Different countries, different accents, different senses of humour — all genuinely invested in you."
        />
        <div className={styles.grid}>
          {featured.map((teacher, i) => (
            <Reveal as="div" key={teacher.name} delay={i * 70}>
              <TeacherCard {...teacher} />
            </Reveal>
          ))}
        </div>
        <div className={styles.footer}>
          <Button href="/meet-us" variant="secondary">
            Meet the whole team
          </Button>
        </div>
      </div>
    </section>
  );
}
