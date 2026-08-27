import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const maintenanceAllowedPrefixes = ["/administration", "/auth"];

function isMaintenanceAllowed(pathname: string) {
  return (
    pathname === "/maintenance" ||
    pathname === "/connexion" ||
    maintenanceAllowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export async function proxy(request: NextRequest) {
  const maintenanceEnabled = process.env.MAINTENANCE_MODE?.toLowerCase() === "true";
  const { pathname } = request.nextUrl;

  if (maintenanceEnabled && !isMaintenanceAllowed(pathname)) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";
    return NextResponse.redirect(maintenanceUrl, 307);
  }

  // La page de maintenance doit rester autonome, y compris si Supabase est indisponible.
  if (pathname === "/maintenance") {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
