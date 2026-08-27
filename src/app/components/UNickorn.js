import Image from "next/image";
import Link from "next/link";
import styles from "./UNickorn.module.css";

const ASSETS = {
  peek: { src: "/brand/unickorn-peek.png", width: 1024, height: 1536 },
  sign: { src: "/brand/unickorn-sign.png", width: 1024, height: 1536 },
};

/**
 * uNickorn brand mascot — used sparingly as a small illustrative
 * accent (never as the hero of a layout).
 *
 * variant:
 *  - "mark" / "wave" / "trophy"  the mascot peeking in, for hellos and small wins
 *  - "sign"                      the mascot holding a sign board (pass `signText`)
 */
// `signText` i `ariaLabel` mają domyślne `null` (a nie brak wartości), żeby
// TypeScript widział je jako opcjonalne, gdy maskotka jest używana z .tsx.
export default function UNickorn({ variant = "mark", signText = null, size = 96, className = "", float = false, href = null, ariaLabel = null }) {
  const asset = variant === "sign" ? ASSETS.sign : ASSETS.peek;
  const height = Math.round((size * asset.height) / asset.width);

  const image = (
    <Image
      src={asset.src}
      alt=""
      width={size}
      height={height}
      aria-hidden="true"
      className={[styles.mark, float ? "float" : ""].filter(Boolean).join(" ")}
    />
  );

  const inner = variant === "sign" && signText ? (
    <>
      {image}
      <span className={styles.board}>{signText}</span>
    </>
  ) : image;

  // Klikalna maskotka (np. powrót na stronę główną)
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel || "uNick Academy"} className={`${styles.link} ${variant === "sign" && signText ? styles.wrap : ""} ${className}`.trim()}>
        {inner}
      </Link>
    );
  }

  if (variant === "sign" && signText) {
    return (
      <span className={`${styles.wrap} ${className}`.trim()}>
        {inner}
      </span>
    );
  }

  return <span className={className}>{inner}</span>;
}
