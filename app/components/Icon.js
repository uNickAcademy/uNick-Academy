const PATHS = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9Z" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1.2 3.5A8.4 8.4 0 0 1 21 11.5Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  heart: (
    <path d="M12 21s-7.5-4.6-9.5-9.1C1.2 8.9 3 5.5 6.5 5.5c2 0 3.5 1.2 5.5 3.6 2-2.4 3.5-3.6 5.5-3.6 3.5 0 5.3 3.4 4 6.4C19.5 16.4 12 21 12 21Z" />
  ),
  puzzle: (
    <path d="M9 4h4a1 1 0 0 1 1 1v1.6a1.6 1.6 0 0 0 3.2 0V5a1 1 0 0 1 1-1H19a1 1 0 0 1 1 1v4.8a1 1 0 0 1-1 1h-1.6a1.6 1.6 0 0 0 0 3.2H19a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-4.8a1 1 0 0 1-1-1v-1.6a1.6 1.6 0 0 0-3.2 0V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.6a1.6 1.6 0 0 0 0-3.2H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4Z" />
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
    </>
  ),
  spark: (
    <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeLinecap="round" />
  ),
  handshake: (
    <path d="M8 12 4 8.5 7.5 5 12 9l2-2 3 3-2 2 2.5 2.5a1.7 1.7 0 0 1-2.4 2.4L13 14.8M9 13l-2.5 2.5a1.7 1.7 0 0 0 2.4 2.4L11.5 16" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" strokeWidth="3" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 13.5c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" strokeLinecap="round" />
      <path d="M8.5 9.5h.01M15.5 9.5h.01" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5Z" />
  ),
  feather: (
    <path d="M20 4c-4 0-12 2-14 10-1 4 1 6 5 5C19 17 20 9 20 4Z M9 15 4 20" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  arrowRight: (
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

/**
 * Minimal, consistent line-icon set used across the site.
 * Pass a `name` matching one of the keys above.
 */
export default function Icon({ name, size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.spark}
    </svg>
  );
}
