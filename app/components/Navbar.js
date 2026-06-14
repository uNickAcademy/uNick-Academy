"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ConsultationButton from "./ConsultationButton";
import { primaryNav, platformLinks, siteConfig } from "../lib/site-config";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo} onClick={() => setOpen(false)}>
          <span className={styles.logoMark}>
            <Image src="/brand/shield.png" alt="" width={26} height={33} aria-hidden="true" />
          </span>
          <span>
            <span className={styles.logoRed}>uNick</span> Academy
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <ConsultationButton small className={styles.ctaDesktop}>
            Free Consultation
          </ConsultationButton>
          <button
            className={styles.menuToggle}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.mobilePanel}>
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileExtra}>
            <Link
              href={platformLinks.studentLogin.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {platformLinks.studentLogin.label}
            </Link>
            <ConsultationButton fullWidth onClick={() => setOpen(false)} />
          </div>
        </div>
      )}
      <span className="visually-hidden">{siteConfig.name}</span>
    </header>
  );
}
