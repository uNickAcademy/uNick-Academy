"use client";

import { useEffect } from "react";

// The root layout (shared with /academy) renders <html lang="pl"> statically.
// This corrects the lang attribute for /en pages without needing a
// locale-aware root layout.
export function SetHtmlLang({ locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
