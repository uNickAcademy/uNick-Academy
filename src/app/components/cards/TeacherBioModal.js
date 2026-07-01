"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Button from "../Button";
import styles from "./TeacherBioModal.module.css";
import { youtubeId } from "../../lib/youtube";

function formatTime(time) {
  return time.slice(0, 5);
}

export default function TeacherBioModal({ teacher, t, bookLabel, onBook, onClose }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!teacher) return null;

  const { name, role, photo, bio, video, availability } = teacher;
  const sortedAvailability = [...availability].sort((a, b) => a.day_of_week - b.day_of_week);
  const ytId = youtubeId(video);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="teacher-bio-title">
        <button className={styles.close} onClick={onClose} aria-label={t.closeAria}>
          ✕
        </button>

        {ytId && playing ? (
          <div className={styles.videoEmbed}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title={name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : ytId ? (
          <button
            type="button"
            className={styles.videoTile}
            onClick={() => setPlaying(true)}
            aria-label={t.playVideoAria || name}
          >
            {photo ? (
              <Image src={photo} alt={name} fill className={styles.videoTilePhoto} />
            ) : (
              <span className={styles.initial}>{name.charAt(0)}</span>
            )}
            <span className={styles.playIcon} aria-hidden="true">
              ▶
            </span>
          </button>
        ) : (
          <div className={styles.photoFrame}>
            {photo ? (
              <Image src={photo} alt={name} width={160} height={160} className={styles.photo} />
            ) : (
              <span className={styles.initial}>{name.charAt(0)}</span>
            )}
          </div>
        )}

        <h2 id="teacher-bio-title" className={styles.title}>
          {name}
        </h2>
        {role && <span className={styles.subject}>{role}</span>}

        <p className={styles.bio}>{bio || t.noBio}</p>

        <h3 className={styles.availabilityHeading}>{t.availabilityLabel}</h3>
        {sortedAvailability.length > 0 ? (
          <ul className={styles.availabilityList}>
            {sortedAvailability.map((slot) => (
              <li key={slot.id} className={styles.availabilitySlot}>
                <span className={styles.day}>{t.days[slot.day_of_week]}</span>
                <span>
                  {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noAvailability}>{t.noAvailability}</p>
        )}

        {ytId && !playing && (
          <button type="button" className={styles.watchVideoBtn} onClick={() => setPlaying(true)}>
            <span aria-hidden="true">▶</span> {t.watchVideo || "Poznaj mnie"}
          </button>
        )}

        <Button variant="primary" fullWidth className={styles.bookBtn} onClick={() => onBook(name)}>
          {bookLabel}
        </Button>
      </div>
    </div>
  );
}
