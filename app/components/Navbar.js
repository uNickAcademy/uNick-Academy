"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ConsultationButton from "./ConsultationButton";
import { getPrimaryNav, platformLinks, siteConfig } from "../lib/site-config";
import { locales } from "../lib/dictionaries";
import styles from "./Navbar.module.css";

function switchLocalePath(pathname, targetLocale) {
  const segments = pathname.split("/");
  segments[1] = targetLocale;
  return segments.join("/") || `/${targetLocale}`;
}

export default function Navbar({ locale, dict }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const primaryNav = getPrimaryNav(locale, dict);
  const homeHref = `/${locale}`;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href={homeHref} className={styles.logo} onClick={() => setOpen(false)}>
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
          <div className={styles.langSwitcher} aria-label={dict.common.languageSwitcher.label}>
            {locales.map((loc) => (
              <Link
                key={loc}
                href={switchLocalePath(pathname, loc)}
                className={`${styles.langLink} ${loc === locale ? styles.langActive : ""}`}
                aria-current={loc === locale ? "true" : undefined}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
          <ConsultationButton small className={styles.ctaDesktop}>
            {dict.common.buttons.freeConsultation}
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
              {dict.common.platformLinks.studentLogin}
            </Link>
            <ConsultationButton fullWidth onClick={() => setOpen(false)} />
          </div>
          <div className={styles.mobileLangSwitcher}>
            {locales.map((loc) => (
              <Link
                key={loc}
                href={switchLocalePath(pathname, loc)}
                className={`${styles.langLink} ${loc === locale ? styles.langActive : ""}`}
                onClick={() => setOpen(false)}
                aria-current={loc === locale ? "true" : undefined}
              >
                {dict.common.languageSwitcher[loc]}
              </Link>
            ))}
          </div>
        </div>
      )}
      <span className="visually-hidden">{siteConfig.name}</span>
    </header>
  );
}
