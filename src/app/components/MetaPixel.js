"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { siteConfig } from "../lib/site-config";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "../lib/cookie-consent";

// Meta Pixel — pomiar konwersji dla reklam na Facebooku i Instagramie.
//
// Dwa warunki, oba muszą być spełnione, inaczej komponent nie renderuje nic:
//  1. zgoda na cookies analityczne (dokładnie tak samo jak GA4 — baner obiecuje,
//     że przy „tylko niezbędne" żaden skrypt śledzący się nie ładuje),
//  2. ustawione NEXT_PUBLIC_META_PIXEL_ID.
//
// Identyfikator idzie ze zmiennej środowiskowej, a nie z site-config, bo pixel
// powstaje w Meta Events Managerze — do czasu jego założenia strona ma po
// prostu działać bez pomiaru Meta, bez zmian w kodzie i bez wdrożenia w dniu
// startu kampanii (wystarczy dodać zmienną w Vercelu).
export default function MetaPixel() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => setEnabled(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  const id = siteConfig.metaPixelId;
  if (!enabled || !id) return null;

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}

// Świadomie pomijamy wariant <noscript> z instrukcji Meta: ten komponent
// renderuje się dopiero po zgodzie zapisanej przez JavaScript, więc w
// przeglądarce bez JS i tak nigdy by się nie pojawił — byłby to martwy kod
// udający pomiar.
