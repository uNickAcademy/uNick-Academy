import Reveal from "../../components/Reveal";
import { getDictionary } from "../../lib/dictionaries";
import { buildMetadata } from "../../lib/seo";
import { getCurrentTerms } from "@/lib/supabase/queries";
import styles from "../../components/sections.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.legal.termsOfService;
  return buildMetadata({
    locale,
    path: "/terms-of-service",
    title: t.title,
    description: `${t.title} — uNick Academy.`,
  });
}

// Regulamin ma jedno źródło prawdy i jeden adres.
//
// W wersji polskiej renderujemy dokument z bazy (`terms_documents`) — to ten
// sam, którego wersję zapisujemy w `consent_acceptances` przy zapisie na
// zajęcia. Wcześniej istniały dwa różne teksty: ten ze słowników i ten z bazy,
// wklejany do rozwijanej harmonijki w kreatorze. Klient akceptował jeden,
// a czytał drugi.
//
// Wersja angielska zostaje na słowniku: dokument w bazie jest po polsku, a
// stroną umowy dla polskiego rynku jest wersja polska. Angielska pełni rolę
// tłumaczenia informacyjnego.
export default async function TermsOfServicePage({ params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const t = dict.legal.termsOfService;

  const terms = locale === "pl" ? await getCurrentTerms() : null;

  if (terms) {
    return (
      <div className="container" style={{ maxWidth: 720, paddingTop: "clamp(48px, 8vw, 80px)", paddingBottom: 64 }}>
        <Reveal as="div">
          <h1 className={styles.title}>{terms.title}</h1>
          <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 40 }}>
            Wersja {terms.version}
          </p>
          <div style={{ color: "var(--color-ink-soft)", lineHeight: 1.75, fontSize: 15, whiteSpace: "pre-wrap" }}>
            {terms.content}
          </div>
        </Reveal>
      </div>
    );
  }

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
