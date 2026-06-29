"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ConsultationButton from "./ConsultationButton";
import { getPrimaryNav, platformLinks, siteConfig } from "../lib/site-config";

import styles from "./Navbar.module.css";

function switchLocalePath(pathname, targetLocale) {
  const segments = pathname.split("/");
  segments[1] = targetLocale;
  return segments.join("/") || `/${targetLocale}`;
}

function DropdownItem({ item, pathname, onNavigate }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isChildActive = item.children.some((child) => pathname === child.href);

  return (
    <div
      className={styles.dropdown}
      ref={dropdownRef}
      onMouseEnter={() => setDropdownOpen(true)}
      onMouseLeave={() => setDropdownOpen(false)}
    >
      <button
        className={`${styles.navLink} ${isChildActive ? styles.active : ""}`}
        onClick={() => setDropdownOpen((v) => !v)}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        type="button"
      >
        {item.label}
        <svg className={styles.chevron} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {dropdownOpen && (
        <div className={styles.dropdownMenu}>
          {item.children.map((child) => {
            const isActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`${styles.dropdownLink} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigate?.();
                }}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ locale, dict }) {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
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
            if (item.children) {
              return <DropdownItem key={item.label} item={item} pathname={pathname} />;
            }
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
            <Link
              href={switchLocalePath(pathname, "en")}
              className={`${styles.flagLink} ${"en" === locale ? styles.flagActive : ""}`}
              aria-current={"en" === locale ? "true" : undefined}
              aria-label="English"
              title="English"
            >
              <Image src="/flags/gb.svg" alt="" width={22} height={16} aria-hidden="true" />
            </Link>
            <Link
              href={switchLocalePath(pathname, "pl")}
              className={`${styles.flagLink} ${"pl" === locale ? styles.flagActive : ""}`}
              aria-current={"pl" === locale ? "true" : undefined}
              aria-label="Polski"
              title="Polski"
            >
              <Image src="/flags/pl.svg" alt="" width={22} height={16} aria-hidden="true" />
            </Link>
          </div>
          <Link href="/login" className={styles.loginLink}>
            {dict.common.nav.login}
          </Link>
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
          {primaryNav.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className={styles.mobileGroup}>
                  <button
                    className={styles.mobileGroupToggle}
                    onClick={() => setMobileExpanded((v) => !v)}
                    aria-expanded={mobileExpanded}
                    type="button"
                  >
                    {item.label}
                    <svg className={`${styles.chevron} ${mobileExpanded ? styles.chevronOpen : ""}`} width="12" height="7" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {mobileExpanded && (
                    <div className={styles.mobileSubLinks}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={styles.mobileSubLink}
                          onClick={() => { setOpen(false); setMobileExpanded(false); }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileLink}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
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
            <Link
              href={switchLocalePath(pathname, "en")}
              className={`${styles.flagLink} ${"en" === locale ? styles.flagActive : ""}`}
              onClick={() => setOpen(false)}
              aria-current={"en" === locale ? "true" : undefined}
              aria-label="English"
            >
              <Image src="/flags/gb.svg" alt="" width={26} height={19} aria-hidden="true" />
              <span>English</span>
            </Link>
            <Link
              href={switchLocalePath(pathname, "pl")}
              className={`${styles.flagLink} ${"pl" === locale ? styles.flagActive : ""}`}
              onClick={() => setOpen(false)}
              aria-current={"pl" === locale ? "true" : undefined}
              aria-label="Polski"
            >
              <Image src="/flags/pl.svg" alt="" width={26} height={19} aria-hidden="true" />
              <span>Polski</span>
            </Link>
          </div>
        </div>
      )}
      <span className="visually-hidden">{siteConfig.name}</span>
    </header>
  );
}
