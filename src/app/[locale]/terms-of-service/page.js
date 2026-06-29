import Reveal from "../../components/Reveal";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.legal.termsOfService.title };
}

export default async function TermsOfServicePage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.legal.termsOfService;

  const sections = [
    { heading: t.general, text: t.generalText },
    { heading: t.services, text: t.servicesText },
    { heading: t.accounts, text: t.accountsText },
    { heading: t.payments, text: t.paymentsText },
    { heading: t.withdrawal, text: t.withdrawalText },
    { heading: t.complaints, text: t.complaintsText },
    { heading: t.liability, text: t.liabilityText },
    { heading: t.intellectualProperty, text: t.intellectualPropertyText },
    { heading: t.governing, text: t.governingText },
  ];

  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: "clamp(48px, 8vw, 80px)", paddingBottom: 64 }}>
      <Reveal as="div">
        <h1 className={styles.title}>{t.title}</h1>
        <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 40 }}>{t.lastUpdated}</p>
        {sections.map((s) => (
          <div key={s.heading} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-blue)", marginBottom: 8 }}>{s.heading}</h2>
            <p style={{ color: "var(--color-ink-soft)", lineHeight: 1.75, fontSize: 15 }}>{s.text}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
