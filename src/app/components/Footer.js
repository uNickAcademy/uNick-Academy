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
              {siteConfig.social.youtube && (
                <a
                  href={siteConfig.social.youtube}
                  className={styles.socialLink}
                  aria-label="uNick Academy on YouTube"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
                  </svg>
                </a>
              )}
              {siteConfig.social.linkedin && (
                <a
                  href={siteConfig.social.linkedin}
                  className={styles.socialLink}
                  aria-label="uNick Academy on LinkedIn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21H9z" />
                  </svg>
                </a>
              )}
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
            <Link href={`/${locale}/privacy-policy`}>{dict.legal.privacyPolicy.title}</Link>
            <Link href={`/${locale}/terms-of-service`}>{dict.legal.termsOfService.title}</Link>
            <Link href={platformLinks.studentLogin.href}>{dict.common.platformLinks.studentLogin}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
