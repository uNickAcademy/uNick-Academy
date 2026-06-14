import Image from "next/image";
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
export default function UNickorn({ variant = "mark", signText, size = 96, className = "", float = false }) {
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

  if (variant === "sign" && signText) {
    return (
      <span className={`${styles.wrap} ${className}`.trim()}>
        {image}
        <span className={styles.board}>{signText}</span>
      </span>
    );
  }

  return <span className={className}>{image}</span>;
}
