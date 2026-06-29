"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./CookieBanner.module.css";

export default function CookieBanner({ locale, dict }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept(level) {
    localStorage.setItem("cookie-consent", level);
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
