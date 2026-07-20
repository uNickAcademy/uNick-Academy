"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CookieBanner.module.css";
import { CONSENT_STORAGE_KEY, CONSENT_CHANGED_EVENT } from "../lib/cookie-consent";

export default function CookieBanner({ locale, dict }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept(level) {
    localStorage.setItem(CONSENT_STORAGE_KEY, level);
    // Powiadamia GoogleAnalytics (i inne skrypty zależne od zgody) bez
    // przeładowania strony — reaguje natychmiast na wybór użytkownika.
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setVisible(false);
  }

  if (!visible) return null;

  const t = dict.legal.cookieBanner;

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.text}>
        {t.text}{" "}
        <Link href={`/${locale}/privacy-policy`} className={styles.link}>
          {t.learnMore}
        </Link>
      </p>
      <div className={styles.actions}>
        <button className={styles.reject} onClick={() => accept("essential")}>
          {t.reject}
        </button>
        <button className={styles.accept} onClick={() => accept("all")}>
          {t.accept}
        </button>
      </div>
    </div>
  );
}
