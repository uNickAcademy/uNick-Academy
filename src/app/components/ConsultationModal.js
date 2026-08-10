"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import UNickorn from "./UNickorn";
import ConsentCheckboxes from "./ConsentCheckboxes";
import styles from "./ConsultationModal.module.css";
import { trackConversion, readCampaign } from "@/lib/analytics/track";

// Kod z linku ?ref= to tylko wartość startowa — pole zostaje edytowalne, bo
// większość poleceń dzieje się ustnie: znajoma dostaje kod od kogoś i wchodzi
// na stronę normalnie, bez linku. Bez pola do wpisania takie polecenie ginie.
function readReferralCodeFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get("ref") || "";
  } catch {
    return "";
  }
}

export default function ConsultationModal({ isOpen, onClose, audience, teacher, dict, locale }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [referralCode, setReferralCode] = useState(() => readReferralCodeFromUrl());
  const referralFromLink = !!readReferralCodeFromUrl();

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setSubmitError(null);
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
      referralCode,
      // Bez tego konsultacje wpadały do lejka jako „(brak kampanii)" — modal
      // otwiera się z dowolnej strony marketingowej, więc reklama, z której
      // ktoś przyszedł, była tu tracona w całości.
      campaign: readCampaign(),
    };

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Submission failed");
      }

      trackConversion("konsultacja_wyslana", {
        metaEvent: "Lead",
        odbiorca: data.audience || null,
        campaign: data.campaign,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
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

            {submitError && (
              <p style={{ color: "var(--color-red)", fontSize: 14, marginBottom: 12 }}>
                {submitError}
              </p>
            )}

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
                <label className={styles.label} htmlFor="consult-referral">
                  {t.referralLabel}
                </label>
                <input
                  id="consult-referral"
                  name="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className={styles.input}
                  placeholder={t.referralPlaceholder}
                />
                <p className={styles.hint}>
                  {referralFromLink ? t.referralFromLink : t.referralHint}
                </p>
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

              <ConsentCheckboxes locale={locale} dict={dict} showMarketing />

              <Button type="submit" variant="primary" fullWidth className={styles.submit} disabled={submitting}>
                {submitting ? "..." : t.submit}
              </Button>
            </form>

            <p className={styles.fineprint}>{t.fineprint}</p>
          </>
        )}
      </div>
    </div>
  );
}
