"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import UNickorn from "./UNickorn";
import styles from "./ConsultationModal.module.css";

export default function ConsultationModal({ isOpen, onClose, audience, teacher, dict }) {
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

  const t = dict.consultationModal;
  const fields = dict.common.formFields;
  const audienceOptions = Object.entries(dict.common.audienceOptions).map(([value, label]) => ({
    value,
    label,
  }));

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
        <button className={styles.close} onClick={onClose} aria-label={t.closeAria}>
          ✕
        </button>

        {submitted ? (
          <div className={styles.success}>
            <UNickorn variant="trophy" size={84} className={styles.successMark} />
            <h2 id="consultation-title" className={styles.title}>
              {t.success.title}
            </h2>
            <p className={styles.subtitle}>{t.success.subtitle}</p>
            <Button variant="secondary" onClick={onClose} fullWidth>
              {t.success.close}
            </Button>
          </div>
        ) : (
          <>
            <span className={`eyebrow ${styles.eyebrow}`}>{t.eyebrow}</span>
            <h2 id="consultation-title" className={styles.title}>
              {t.title}
            </h2>
            <p className={styles.subtitle}>{t.subtitle}</p>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-name">
                  {fields.name}
                </label>
                <input
                  id="consult-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className={styles.input}
                  placeholder={fields.namePlaceholder}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-email">
                  {fields.email}
                </label>
                <input
                  id="consult-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={styles.input}
                  placeholder={fields.emailPlaceholder}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-phone">
                  {fields.phone}
                </label>
                <input
                  id="consult-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  placeholder={fields.phonePlaceholder}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-audience">
                  {t.audienceLabel}
                </label>
                <select
                  id="consult-audience"
                  name="audience"
                  className={styles.select}
                  defaultValue={audience || ""}
                >
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

              <div className={styles.field}>
                <label className={styles.label} htmlFor="consult-message">
                  {t.messageLabel}
                </label>
                <textarea
                  id="consult-message"
                  name="message"
                  className={styles.textarea}
                  placeholder={t.messagePlaceholder}
                  defaultValue={teacher ? `${t.teacherRequest || "I'd like to book a lesson with"} ${teacher}` : ""}
                />
              </div>

              <Button type="submit" variant="primary" fullWidth className={styles.submit}>
                {t.submit}
              </Button>
            </form>

            <p className={styles.fineprint}>{t.fineprint}</p>
          </>
        )}
      </div>
    </div>
  );
}
