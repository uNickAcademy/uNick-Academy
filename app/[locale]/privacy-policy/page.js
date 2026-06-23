import Reveal from "../../components/Reveal";
import { getDictionary } from "../../lib/dictionaries";
import styles from "../../components/sections.module.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return { title: dict.legal.privacyPolicy.title };
}

export default async function PrivacyPolicyPage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.legal.privacyPolicy;

  const sections = [
    { heading: t.controller, text: t.controllerText },
    { heading: t.whatWeCollect, text: t.whatWeCollectText },
    { heading: t.whyWeCollect, text: t.whyWeCollectText },
    { heading: t.thirdParties, text: t.thirdPartiesText },
    { heading: t.retention, text: t.retentionText },
    { heading: t.rights, text: t.rightsText },
    { heading: t.complaints, text: t.complaintsText },
    { heading: t.cookies, text: t.cookiesText },
    { heading: t.ai, text: t.aiText },
    { heading: t.changes, text: t.changesText },
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
