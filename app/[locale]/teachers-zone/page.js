import Link from "next/link";
import Reveal from "../../components/Reveal";
import SectionHeading from "../../components/SectionHeading";
import ConsultationButton from "../../components/ConsultationButton";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return dict.teachersZone.meta;
}

export default async function TeachersZonePage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.teachersZone;

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
              href="/academy/login"
              className="pill-btn"
              style={{ display: "inline-flex", padding: "14px 36px", fontSize: "16px" }}
            >
              {t.login.button}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal as="div">
          <SectionHeading eyebrow={t.shop.eyebrow} title={t.shop.title} subtitle={t.shop.subtitle} />
          <div
            style={{
              marginTop: "2rem",
              padding: "3rem 2rem",
              textAlign: "center",
              background: "var(--color-cream)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              color: "var(--color-ink-soft)",
              fontSize: "1.05rem",
            }}
          >
            {t.shop.comingSoon}
          </div>
        </Reveal>
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
