import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict TypeScript on builds (kod jest czysty: 0 błędów tsc).
  typescript: { ignoreBuildErrors: false },
  // ESLint wyłączony w buildzie: reguła react-hooks/purity zgłasza fałszywe
  // alarmy na Date.now()/new Date() w asynchronicznych Server Components
  // (liczenie zakresów dat do zapytań). Lint uruchamiamy ręcznie: `npm run lint`.
  eslint: { ignoreDuringBuilds: true },
  // Middleware w runtime Node.js (nie Edge). Klient Supabase (@supabase/ssr →
  // supabase-js) używa process.version, co Vercel odrzuca przy walidacji Edge
  // (błąd edge_invalid_api). W Node.js runtime problem znika.
  // nodeMiddleware działa w runtime Next 15.5, ale nie ma go jeszcze w typach.
  experimental: { nodeMiddleware: true } as NextConfig["experimental"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "xkydfgunafxfuzsggmca.supabase.co" },
      // Zdjęcia nauczycieli na stronie marketingowej (z obecnej strony WP).
      { protocol: "https", hostname: "unickacademy.pl", pathname: "/wp-content/uploads/**" },
    ],
  },
  // Polskie aliasy tras prawnych/kontaktu — stopka i CTA linkowały do /kontakt,
  // /polityka-prywatnosci i /regulamin, które nie istniały (404). Właściwe strony
  // żyją pod [locale]; przekierowujemy zamiast utrzymywać duplikaty treści.
  async redirects() {
    return [
      { source: "/kontakt", destination: "/pl/contact", permanent: false },
      { source: "/polityka-prywatnosci", destination: "/pl/privacy-policy", permanent: false },
      { source: "/regulamin", destination: "/pl/terms-of-service", permanent: false },

      // Krótki adres na formularz dostępności (nabór wrzesień 2026), do druku
      // i mówienia na głos — /pl/dostepnosc jest niewygodne do podyktowania.
      // Tymczasowy, usuń razem z resztą naboru (docs/FORMULARZ-DOSTEPNOSCI.md).
      { source: "/september", destination: "/pl/dostepnosc", permanent: false },

      // Lokalna strona docelowa ma różne slugi w każdym języku. Kierujemy
      // „zły” slug w danym języku na właściwy odpowiednik (301), aby uniknąć
      // duplikatów i utrzymać jeden kanoniczny URL na język.
      { source: "/en/szkola-jezykowa-tarnowo-podgorne", destination: "/en/english-school-tarnowo-podgorne", permanent: true },
      { source: "/pl/english-school-tarnowo-podgorne", destination: "/pl/szkola-jezykowa-tarnowo-podgorne", permanent: true },

      // Mapa 1:1 ze starej strony WordPress (unickacademy.pl) na nowe
      // odpowiedniki tematyczne. Przekierowanie SAMEJ starej domeny na nową
      // realizujemy na poziomie hostingu/DNS — patrz docs/HOSTING_AND_DOMAIN_REDIRECTS.md.
      { source: "/dla-firm", destination: "/pl/companies", permanent: true },
      { source: "/o-nas", destination: "/pl/meet-us", permanent: true },
      { source: "/nauczyciele", destination: "/pl/meet-us", permanent: true },
      { source: "/metoda", destination: "/pl/how-we-teach", permanent: true },
      { source: "/jak-uczymy", destination: "/pl/how-we-teach", permanent: true },
      { source: "/dzieci", destination: "/pl/children", permanent: true },
      { source: "/mlodziez", destination: "/pl/teenagers", permanent: true },
      { source: "/dorosli", destination: "/pl/adults", permanent: true },
      { source: "/angielski-dla-dzieci", destination: "/pl/children", permanent: true },
      { source: "/angielski-dla-firm", destination: "/pl/companies", permanent: true },
      { source: "/regulamin-serwisu", destination: "/pl/terms-of-service", permanent: true },
    ];
  },
};

export default nextConfig;
