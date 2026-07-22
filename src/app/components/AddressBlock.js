import Button from "./Button";
import { siteConfig, mapsDirectionsUrl } from "../lib/site-config";

// Blok NAP (Name / Address / Phone) renderowany jako semantyczny <address>
// z prawdziwym tekstem HTML — dostępny dla wyszukiwarek i botów AI, nie tylko
// jako grafika. Reużywany na stronie kontaktu, lokalnej i w stopce.
//
// variant: "full" (z nagłówkiem i przyciskami) | "compact" (sam adres)
export default function AddressBlock({ dict, variant = "full", className = "" }) {
  const a = siteConfig.address;
  const t = dict?.common?.nap || {};

  return (
    <address className={className} style={{ fontStyle: "normal", lineHeight: 1.7 }}>
      <strong>{siteConfig.name}</strong>
      <br />
      {a.streetAddress}
      <br />
      {a.village}, {a.postalCode} {a.addressLocality}
      <br />
      {a.municipality}, woj. {a.addressRegion}
      <br />
      <a href={`tel:${siteConfig.phone.e164}`} style={{ fontWeight: 700, color: "var(--color-blue)" }}>
        {siteConfig.phone.display}
      </a>
      {" · "}
      <a href={`mailto:${siteConfig.email}`} style={{ fontWeight: 700, color: "var(--color-blue)" }}>
        {siteConfig.email}
      </a>

      {variant === "full" && (
        <span style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1.1rem" }}>
          <Button href={`tel:${siteConfig.phone.e164}`} variant="secondary" small>
            {t.call || "Zadzwoń"}
          </Button>
          <Button href={`mailto:${siteConfig.email}`} variant="secondary" small>
            {t.write || "Napisz"}
          </Button>
          <Button href={mapsDirectionsUrl()} variant="secondary" small target="_blank" rel="noreferrer">
            {t.directions || "Wyznacz trasę"}
          </Button>
        </span>
      )}
    </address>
  );
}
