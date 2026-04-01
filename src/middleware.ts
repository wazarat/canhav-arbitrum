import { NextRequest, NextResponse } from "next/server";

const LANDING_DOMAIN_HOSTS = ["canhav.co", "www.canhav.co"];

const ALLOWED_PATHS_ON_LANDING = ["/getstarted", "/api/submissions"];

function isAllowedOnLandingDomain(pathname: string): boolean {
  if (ALLOWED_PATHS_ON_LANDING.includes(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname === "/ch-logo.svg") return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (!LANDING_DOMAIN_HOSTS.includes(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isAllowedOnLandingDomain(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/getstarted";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
