"use client";

import Link from "next/link";
import styles from "./ConsentCheckboxes.module.css";

export default function ConsentCheckboxes({ locale, dict, showMarketing = false }) {
  const t = dict.legal.consent;

  return (
    <div className={styles.consents}>
      <label className={styles.checkbox}>
        <input type="checkbox" name="consent_privacy" required />
        <span>
          {t.privacy}{" "}
          <Link href={`/${locale}/privacy-policy`} target="_blank" className={styles.link}>
            {t.privacyLink}
          </Link>{" "}
          {t.terms}{" "}
          <Link href={`/${locale}/terms-of-service`} target="_blank" className={styles.link}>
            {t.termsLink}
          </Link>
          .*
        </span>
      </label>
      {showMarketing && (
        <label className={styles.checkbox}>
          <input type="checkbox" name="consent_marketing" />
          <span>{t.marketing}</span>
        </label>
      )}
    </div>
  );
}
