import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import {
  AvailableLanguageTag,
  availableLanguageTags,
  sourceLanguageTag,
} from "./paraglide/runtime";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
/**
 * Sets the request headers to resolve the language tag in RSC.
 *
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */

function getLocale(request: NextRequest) {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  let languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  const preferredLocale = match(
    languages,
    availableLanguageTags,
    sourceLanguageTag
  );
  return preferredLocale;
}

export function middleware(request: NextRequest) {
  const test = getLocale(request);
  //Get's the first segment of the URL path
  const maybeLocale = request.nextUrl.pathname.split("/")[1];
  let cookie = request.cookies.get("language");
  //If it's not a valid language tag, redirect to the default language
  if (!availableLanguageTags.includes(maybeLocale as any)) {
    let redirectUrl = `/${test}${request.nextUrl.pathname}`;
    if (cookie) {
      redirectUrl = `/${cookie.value}${request.nextUrl.pathname}`;
      request.nextUrl.pathname = redirectUrl;
      if (cookie.value === sourceLanguageTag) {
        return NextResponse.redirect(request.nextUrl);
      }
      return NextResponse.redirect(request.nextUrl);
    }
    request.nextUrl.pathname = redirectUrl;
    return NextResponse.redirect(request.nextUrl);
  }

  //it _IS_ a valid language tag, so set the language tag header
  const locale = maybeLocale as AvailableLanguageTag;

  const headers = new Headers(request.headers);
  headers.set("x-language-tag", locale);
  const response = NextResponse.next({
    request: {
      headers,
    },
  });
  response.cookies.set("language", locale, { maxAge: 31536000 });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
