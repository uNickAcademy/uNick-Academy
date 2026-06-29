import styles from "./PlaceholderMedia.module.css";

const TONES = {
  blue: { a: "#E7ECF4", b: "#F4EBDD" },
  red: { a: "#F7E2DD", b: "#FAF4EC" },
  cream: { a: "#F4EBDD", b: "#ECDFC9" },
  sand: { a: "#ECDFC9", b: "#E7ECF4" },
};

const RATIO_CLASS = {
  "1:1": styles.ratio1x1,
  "4:3": styles.ratio4x3,
  "3:4": styles.ratio3x4,
  "16:9": styles.ratio16x9,
  "3:2": styles.ratio3x2,
};

/**
 * Visual placeholder for future photography / video.
 * Renders as a soft gradient block with a caption describing the
 * intended shot, so editors know exactly what to source/shoot.
 *
 * kind: "photo" | "video"
 * tone: "blue" | "red" | "cream" | "sand"
 * ratio: "1:1" | "4:3" | "3:4" | "16:9" | "3:2"
 */
export default function PlaceholderMedia({
  caption,
  kind = "photo",
  tone = "blue",
  ratio = "4:3",
  className = "",
}) {
  const { a, b } = TONES[tone] || TONES.blue;
  return (
    <div
      className={`${styles.frame} ${RATIO_CLASS[ratio] || styles.ratio4x3} ${className}`.trim()}
      style={{ "--tone-a": a, "--tone-b": b }}
      role="img"
      aria-label={caption}
    >
      {kind === "video" && (
        <span className={styles.icon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
      <span className={styles.caption}>{caption}</span>
    </div>
  );
}
