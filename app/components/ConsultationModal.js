"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import UNickorn from "./UNickorn";
import styles from "./ConsultationModal.module.css";

const AUDIENCE_OPTIONS = [
  { value: "child", label: "My child" },
  { value: "teen", label: "Myself — I'm a teenager" },
  { value: "adult", label: "Myself — I'm an adult" },
  { value: "company", label: "My company / team" },
  { value: "unsure", label: "Not sure yet" },
];

export default function ConsultationModal({ isOpen, onClose, audience }) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultation-title"
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {submitted ? (
          <div className={styles.success}>
            <UNickorn variant="trophy" size={84} className={styles.successMark} />
            <h2 id="consultation-title" className={styles.title}>
              Thank you — we&rsquo;ll be in touch.
            </h2>
            <p className={styles.subtitle}>
              Someone from our team will reach out within one working day to find a
              time that suits you. In the meantime, take a look around — there&rsquo;s
              a place at the table for you.
            </p>
            <Button variant="secondary" onClick={onClose} fullWidth>
              Close
            </Button>
          </div>
        ) : (
          <>
            <span className={`eyebrow ${styles.eyebrow}`}>Free consultation</span>
            <h2 id="consultation-title" className={styles.title}>
              Let&rsquo;s find your people.
            </h2>
            <p className={styles.subtitle}>
              Tell us a little about you and we&rsquo;ll get back to you to arrange a
              free, no-pressure conversation — about you, your goals, and whether
              we&rsquo;re a good fit.
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-name">
                  Name
                </label>
                <input
                  id="consult-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className={styles.input}
                  placeholder="Your name"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-email">
                  Email
                </label>
                <input
                  id="consult-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-phone">
                  Phone (optional)
                </label>
                <input
                  id="consult-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  placeholder="+48 ..."
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-audience">
                  This consultation is for
                </label>
                <select
                  id="consult-audience"
                  name="audience"
                  className={styles.select}
                  defaultValue={audience || ""}
                >
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

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-message">
                  Anything you&rsquo;d like us to know? (optional)
                </label>
                <textarea
                  id="consult-message"
                  name="message"
                  className={styles.textarea}
                  placeholder="e.g. current level, goals, scheduling preferences..."
                />
              </div>

              <Button type="submit" variant="primary" fullWidth className={styles.submit}>
                Send &amp; book my consultation
              </Button>
            </form>

            <p className={styles.fineprint}>
              No pressure, no obligation — just a friendly conversation to see
              where you fit at uNick Academy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
