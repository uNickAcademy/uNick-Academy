import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

// Real root layout for the whole app. `/[locale]/*` (the marketing site)
// and `/academy/*` (uNick Teachers Academy) are siblings under this layout;
// each provides its own nav/footer in a nested layout.
export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
