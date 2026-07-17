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
    ];
  },
};

export default nextConfig;
