import { NextResponse } from "next/server";
import { locales, defaultLocale } from "./app/lib/dictionaries";

// Paths that belong to the existing platform (sign-in, student area,
// admin panel) and must never be redirected into a /en or /pl locale.
const EXTERNAL_PATHS = ["/logowanie", "/admin"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (EXTERNAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return;
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|brand|icon\\.png|favicon\\.ico|.*\\..*).*)"],
};
