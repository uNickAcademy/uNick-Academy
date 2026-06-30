import Image from "next/image";
import styles from "./TeacherCard.module.css";

const TONES = {
  blue: { a: "#E7ECF4", b: "#F4EBDD" },
  red: { a: "#F7E2DD", b: "#FAF4EC" },
  cream: { a: "#F4EBDD", b: "#ECDFC9" },
  sand: { a: "#ECDFC9", b: "#E7ECF4" },
};

export default function TeacherCard({ name, role, photo, tone = "blue", bookLabel, onBook, onPhotoClick }) {
  const { a, b } = TONES[tone] || TONES.blue;

  const frame = (
    <div
      className={`${styles.photoFrame} ${onPhotoClick ? styles.photoFrameClickable : ""}`}
      style={{ "--tone-a": a, "--tone-b": b }}
    >
      {photo ? (
        <Image
          src={photo}
          alt={name}
          width={400}
          height={400}
          className={styles.photo}
        />
      ) : (
        <span className={styles.initial}>{name.charAt(0)}</span>
      )}
    </div>
  );

  return (
    <div className={styles.card}>
      {onPhotoClick ? (
        <button type="button" className={styles.photoButton} onClick={() => onPhotoClick(name)} aria-label={name}>
          {frame}
        </button>
      ) : (
        frame
      )}
      <h3 className={styles.name}>{name}</h3>
      {role && <span className={styles.subject}>{role}</span>}
      {bookLabel && (
        <button
          type="button"
          className={styles.bookBtn}
          onClick={() => onBook?.(name)}
        >
          {bookLabel}
        </button>
      )}
    </div>
  );
}
