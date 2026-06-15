import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { locales, defaultLocale } from "./app/lib/dictionaries";

// Paths that belong to the existing platform (sign-in, student area,
// admin panel, uNick Teachers Academy) and must never be redirected into
// a /en or /pl locale.
const EXTERNAL_PATHS = ["/logowanie", "/admin", "/academy"];

// Academy routes that require a signed-in Supabase user.
const ACADEMY_PROTECTED_PREFIXES = ["/academy/account", "/academy/admin"];

async function guardAcademy(request) {
  const { pathname } = request.nextUrl;

  if (!ACADEMY_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Without Supabase configured, treat protected academy routes as
  // inaccessible rather than throwing - send the visitor to log in.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const url = request.nextUrl.clone();
    url.pathname = "/academy/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/academy/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/academy")) {
    return guardAcademy(request);
  }

  if (EXTERNAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|brand|icon\\.png|favicon\\.ico|.*\\..*).*)"],
};
