import Link from "next/link";
import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import ConsultationButton from "../../components/ConsultationButton";
import LessonPlanShop from "../../components/LessonPlanShop";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.teachersZone.meta;
}

export default async function TeachersZonePage({ params, searchParams }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.teachersZone;

  const sp = await searchParams;
  const level = sp?.level || "";
  const age = sp?.age || "";
  const theme = sp?.theme || "";

  const supabase = await createClient();
  let query = supabase
    .from("lesson_plans")
    .select("id, title, description, cefr_level, age_group, themes, is_free")
    .order("created_at", { ascending: false });

  if (level) query = query.eq("cefr_level", level);
  if (age) query = query.eq("age_group", age);
  if (theme) query = query.contains("themes", [theme]);

  const { data: lessons } = await query;

  return (
    <>
      <div className={`container ${styles.hero}`}>
        <Reveal as="div">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1 className={styles.title}>
            {t.hero.titleStart}
            <span className={styles.accent}>{t.hero.titleAccent}</span>
          </h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
        </Reveal>
      </div>

      <section className={`container ${styles.section}`}>
        <Reveal as="div">
          <SectionHeading eyebrow={t.login.eyebrow} title={t.login.title} subtitle={t.login.subtitle} />
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <Link
              href="/login"
              className="pill-btn"
              style={{ display: "inline-flex", padding: "14px 36px", fontSize: "16px" }}
            >
              {t.login.button}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className={`section ${styles.altSection}`}>
        <div className="container">
          <SectionHeading eyebrow={t.shop.eyebrow} title={t.shop.title} subtitle={t.shop.subtitle} />
          <Reveal as="div" style={{ marginTop: "2rem" }}>
            <LessonPlanShop
              lessons={lessons || []}
              locale={locale}
              t={t.shop}
              level={level}
              age={age}
              theme={theme}
            />
          </Reveal>
        </div>
      </section>

      <section className={`container ${styles.cta}`}>
        <Reveal as="div" style={{ textAlign: "center" }}>
          <h2 className={styles.ctaTitle}>{t.finalCta.title}</h2>
          <p className={styles.subtitle}>{t.finalCta.subtitle}</p>
          <ConsultationButton>{locale === "pl" ? "Skontaktuj się" : "Get in touch"}</ConsultationButton>
        </Reveal>
      </section>
    </>
  );
}
