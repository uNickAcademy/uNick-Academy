import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import Button from "../Button";
import TeacherCard from "../cards/TeacherCard";
import { getTeachers } from "../../lib/teachers";
import styles from "./MeetPeople.module.css";

export default function MeetPeople({ dict, locale }) {
  const t = dict.home.meetPeople;
  const featured = getTeachers(dict).slice(0, 4);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <div className={styles.grid}>
          {featured.map((teacher, i) => (
            <Reveal as="div" key={teacher.name} delay={i * 70}>
              <TeacherCard {...teacher} />
            </Reveal>
          ))}
        </div>
        <div className={styles.footer}>
          <Button href={`/${locale}/meet-us`} variant="secondary">
            {dict.common.buttons.meetWholeTeam}
          </Button>
        </div>
      </div>
    </section>
  );
}
