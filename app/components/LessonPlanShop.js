import Link from "next/link";
import { CEFR_LEVELS, AGE_GROUPS, SKILLS } from "@/lib/constants";
import styles from "./LessonPlanShop.module.css";

function ShopCard({ lesson, t }) {
  const ageLabel =
    AGE_GROUPS.find((g) => g.value === lesson.age_group)?.label ??
    lesson.age_group;

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cefrBadge}>{lesson.cefr_level}</span>
        {lesson.is_free ? (
          <span className={styles.freeBadge}>{t.free}</span>
        ) : (
          <span className={styles.paidBadge}>{t.subscribers}</span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{lesson.title}</h3>
      <p className={styles.cardDesc}>{lesson.description}</p>
      <div className={styles.tags}>
        <span className={styles.tag}>{ageLabel}</span>
        {(lesson.skills || []).map((skill) => (
          <span key={skill} className={styles.tag}>
            {skill}
          </span>
        ))}
      </div>
      {lesson.is_free ? (
        <Link href={`/academy/library/${lesson.id}`} className={styles.cardActionFree}>
          {t.download}
        </Link>
      ) : (
        <Link href="/academy/pricing" className={styles.cardActionPaid}>
          {t.subscribeCta}
        </Link>
      )}
    </div>
  );
}

export default function LessonPlanShop({ lessons, locale, t, level, age, skill }) {
  const basePath = `/${locale}/teachers-zone`;

  return (
    <>
      <form className={styles.filters} action={basePath}>
        <div className={styles.filterGroup}>
          <label htmlFor="shop-level">{t.filterLevel}</label>
          <select id="shop-level" name="level" defaultValue={level}>
            <option value="">{t.allLevels}</option>
            {CEFR_LEVELS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="shop-age">{t.filterAge}</label>
          <select id="shop-age" name="age" defaultValue={age}>
            <option value="">{t.allAges}</option>
            {AGE_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="shop-skill">{t.filterSkill}</label>
          <select id="shop-skill" name="skill" defaultValue={skill}>
            <option value="">{t.allSkills}</option>
            {SKILLS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterActions}>
          <Link href={basePath} className={styles.clearLink}>
            {t.clearFilters}
          </Link>
          <button type="submit" className={styles.applyBtn}>
            {t.apply}
          </button>
        </div>
      </form>

      <div className={styles.banner}>
        {t.subscribeBanner}{" "}
        <Link href="/academy/pricing">{t.subscribeBannerLink}</Link>
      </div>

      {lessons && lessons.length > 0 ? (
        <div className={styles.grid}>
          {lessons.map((lesson) => (
            <ShopCard key={lesson.id} lesson={lesson} t={t} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{t.noResults}</p>
      )}
    </>
  );
}
