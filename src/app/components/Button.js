import Link from "next/link";
import styles from "./Button.module.css";

/**
 * Shared button/link component.
 *
 * variant: "primary" | "secondary" | "ghost"
 * onDark: set true when placed on a dark (navy) background
 * href: renders as a Link; omit to render a <button>
 */
export default function Button({
  href,
  variant = "primary",
  onDark = false,
  small = false,
  fullWidth = false,
  className = "",
  children,
  ...rest
}) {
  const classes = [
    styles.btn,
    styles[variant],
    onDark ? styles.onDark : "",
    small ? styles.small : "",
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
