"use client";

import { useState } from "react";
import Button from "./Button";
import UNickorn from "./UNickorn";
import styles from "./ContactForm.module.css";

export default function ContactForm({ dict }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const t = dict.contactForm;
  const fields = dict.common.formFields;
  const audienceOptions = Object.entries(dict.common.audienceOptions).map(([value, label]) => ({
    value,
    label,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      audience: formData.get("audience"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.form} ${styles.success}`}>
        <UNickorn variant="trophy" size={84} />
        <h2 className={styles.successTitle}>{t.success.title}</h2>
        <p className={styles.successText}>{t.success.text}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {submitError && (
        <p style={{ color: "var(--color-red)", fontSize: 14, marginBottom: 12 }}>
          {submitError}
        </p>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-name">
            {fields.name}
          </label>
          <input id="contact-name" name="name" type="text" required autoComplete="name" className={styles.input} placeholder={fields.namePlaceholder} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-email">
            {fields.email}
          </label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" className={styles.input} placeholder={fields.emailPlaceholder} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-phone">
            {fields.phone}
          </label>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className={styles.input} placeholder={fields.phonePlaceholder} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-audience">
            {t.audienceLabel}
          </label>
          <select id="contact-audience" name="audience" className={styles.select} defaultValue="">
            <option value="" disabled>
              {fields.chooseOne}
            </option>
            {audienceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-message">
          {t.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          className={styles.textarea}
          placeholder={t.messagePlaceholder}
        />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? "..." : t.submit}
      </Button>
    </form>
  );
}
