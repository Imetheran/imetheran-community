import { NextResponse, type NextRequest } from "next/server";
import { readSiteRuntimeSettings } from "@/lib/site-runtime";
import { updateSession } from "@/lib/supabase/proxy";

const maintenanceAllowedPrefixes = ["/administration", "/auth"];

function isMaintenanceAllowed(pathname: string) {
  return (
    pathname === "/maintenance" ||
    pathname === "/connexion" ||
    pathname === "/compte/mot-de-passe" ||
    maintenanceAllowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep the maintenance page autonomous so it still renders if Supabase is unavailable.
  if (pathname === "/maintenance") {
    return NextResponse.next({ request });
  }

  // Administration and authentication routes remain reachable while the public site is closed.
  if (isMaintenanceAllowed(pathname)) {
    return updateSession(request);
  }

  const { maintenanceEnabled } = await readSiteRuntimeSettings();

  if (maintenanceEnabled) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";
    return NextResponse.redirect(maintenanceUrl, 307);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
