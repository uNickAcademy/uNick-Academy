import Link from "next/link";
import Image from "next/image";
import { getFooterNav, platformLinks, siteConfig } from "../lib/site-config";
import styles from "./Footer.module.css";

export default function Footer({ locale, dict }) {
  const year = new Date().getFullYear();
  const footerNav = getFooterNav(locale, dict);
  const homeHref = `/${locale}`;

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href={homeHref} className={styles.logo}>
              <span className={styles.logoMark}>
                <Image src="/brand/shield.png" alt="" width={28} height={35} aria-hidden="true" />
              </span>
              <span>
                <span className={styles.logoRed}>uNick</span> Academy
              </span>
            </Link>
            <p className={styles.tagline}>{dict.meta.description}</p>
            <div className={styles.social}>
              <a
                href={siteConfig.social.instagram}
                className={styles.socialLink}
                aria-label="uNick Academy on Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={siteConfig.social.facebook}
                className={styles.socialLink}
                aria-label="uNick Academy on Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className={styles.socialLink}
                aria-label={`Email ${siteConfig.email}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </a>
            </div>
          </div>

          {footerNav.map((col) => (
            <div key={col.heading}>
              <div className={styles.heading}>{col.heading}</div>
              <div className={styles.list}>
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>
            © {year} {siteConfig.name}. {dict.common.footer.copyright}
          </span>
          <div className={styles.bottomLinks}>
            <Link href={platformLinks.studentLogin.href}>{dict.common.platformLinks.studentLogin}</Link>
            <Link href={platformLinks.adminPanel.href}>{dict.common.platformLinks.adminPanel}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
