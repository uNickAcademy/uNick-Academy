"use client";

import { useState } from "react";
import styles from "./ClassesShowcase.module.css";

const DAYS = {
  pl: ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

function ageText(min, max) {
  if (min != null && max != null) return `${min}–${max} lat`;
  if (min != null) return `${min}+`;
  if (max != null) return `do ${max} lat`;
  return "";
}

// Pojedyncza grupa na grafiku — klik rozwija opis.
export default function ClassGroupItem({ group, locale, t }) {
  const [open, setOpen] = useState(false);
  const days = DAYS[locale] || DAYS.pl;
  const full = group.spots <= 0;
  const levels = group.levels && group.levels.length ? group.levels : (group.level ? [group.level] : []);
  const day = group.dayOfWeek != null ? days[group.dayOfWeek] : "";
  const hasDesc = !!(group.description && group.description.trim());

  return (
    <li className={`${styles.item} ${open ? styles.itemOpen : ""}`}>
      <button
        type="button"
        className={styles.itemBtn}
        onClick={() => hasDesc && setOpen((v) => !v)}
        aria-expanded={hasDesc ? open : undefined}
      >
        <span className={styles.itemMain}>
          <span className={styles.itemName}>
            {group.name}
            {hasDesc && <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true">›</span>}
          </span>
          <span className={styles.meta}>
            {[day, group.schedule_text].filter(Boolean).join(" · ")}
            {ageText(group.ageMin, group.ageMax) ? ` · ${ageText(group.ageMin, group.ageMax)}` : ""}
          </span>
          {levels.length > 0 && (
            <span className={styles.levels}>
              {levels.map((lv) => <span key={lv} className={styles.level}>{lv}</span>)}
            </span>
          )}
        </span>
        <span className={styles.itemSide}>
          {group.pricePerMonth != null && <span className={styles.price}>{group.pricePerMonth} {t.perMonth}</span>}
          <span className={full ? styles.spotsFull : styles.spots}>
            {full ? t.full : `${group.spots} ${t.spots}`}
          </span>
        </span>
      </button>
      {open && hasDesc && <p className={styles.desc}>{group.description}</p>}
    </li>
  );
}
