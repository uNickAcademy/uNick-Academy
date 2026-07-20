// Wspólne stałe dla CookieBanner i GoogleAnalytics — jedno źródło prawdy,
// żeby oba pliki zgadzały się co do klucza w localStorage i nazwy zdarzenia.
export const CONSENT_STORAGE_KEY = "cookie-consent";
export const CONSENT_CHANGED_EVENT = "cookie-consent-changed";
export const CONSENT_ALL = "all";
export const CONSENT_ESSENTIAL = "essential";

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_ALL;
}
