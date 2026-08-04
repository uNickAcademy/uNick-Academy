import { B2bInquiryForm } from "./B2bInquiryForm";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

// Sekcja opakowująca formularz zapytania firmowego w układ stron
// marketingowych. Sam formularz jest komponentem klienckim w Tailwindzie
// (globals.css jest ładowany w layoucie głównym, więc działa też tutaj);
// otoczenie korzysta z siatki i typografii Serwisu A, żeby nie było widać szwu.
export default function B2bInquiryFormSection({ locale }) {
  const pl = locale !== "en";
  return (
    <section id="zapytanie-firmowe" style={{ scrollMarginTop: 80 }}>
      <div className="container" style={{ maxWidth: 760, paddingTop: "clamp(40px, 6vw, 72px)", paddingBottom: "clamp(40px, 6vw, 72px)" }}>
        <SectionHeading
          eyebrow={pl ? "Zapytanie firmowe" : "Corporate enquiry"}
          title={pl ? "Porozmawiajmy o Twoim zespole" : "Let's talk about your team"}
        />
        <Reveal as="div">
          <p style={{ color: "var(--color-ink-soft)", lineHeight: 1.7, fontSize: 15, marginBottom: 24, textAlign: "center" }}>
            {pl
              ? "Zostaw kilka informacji, a przygotujemy propozycję dopasowaną do tego, jak naprawdę pracuje Twój zespół. Odezwiemy się w ciągu 2 dni roboczych."
              : "Leave us a few details and we'll put together a proposal built around how your team actually works. We'll get back to you within 2 business days."}
          </p>
          <B2bInquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
