"use client";

import { useState } from "react";
import Button from "./Button";
import UNickorn from "./UNickorn";
import styles from "./ContactForm.module.css";

const AUDIENCE_OPTIONS = [
  { value: "child", label: "My child" },
  { value: "teen", label: "Myself — I'm a teenager" },
  { value: "adult", label: "Myself — I'm an adult" },
  { value: "company", label: "My company / team" },
  { value: "unsure", label: "Not sure yet" },
];

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`${styles.form} ${styles.success}`}>
        <UNickorn variant="trophy" size={84} />
        <h2 className={styles.successTitle}>Thank you — we&rsquo;ll be in touch.</h2>
        <p className={styles.successText}>
          Someone from our team will reach out within one working day to find a time
          that suits you.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-name">
            Name
          </label>
          <input id="contact-name" name="name" type="text" required autoComplete="name" className={styles.input} placeholder="Your name" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-email">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" className={styles.input} placeholder="you@example.com" />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-phone">
            Phone (optional)
          </label>
          <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className={styles.input} placeholder="+48 ..." />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-audience">
            This is for
          </label>
          <select id="contact-audience" name="audience" className={styles.select} defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-message">
          Tell us a little about you
        </label>
        <textarea
          id="contact-message"
          name="message"
          className={styles.textarea}
          placeholder="Current level, goals, scheduling preferences, anything that would help us..."
        />
      </div>

      <Button type="submit" variant="primary" fullWidth>
        Send message
      </Button>
    </form>
  );
}
