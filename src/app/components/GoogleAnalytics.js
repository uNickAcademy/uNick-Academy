"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { siteConfig } from "../lib/site-config";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "../lib/cookie-consent";

// GA4 wystartuje dopiero po zgodzie na analityczne cookies z CookieBanner —
// przy odrzuceniu ("tylko niezbędne") skrypt w ogóle się nie ładuje, zgodnie
// z tym, co obiecuje baner i polityka prywatności. Reaguje na zgodę udzieloną
// bez przeładowania strony (CONSENT_CHANGED_EVENT z CookieBanner).
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => setEnabled(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  const id = siteConfig.googleAnalyticsId;
  if (!enabled || !id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
