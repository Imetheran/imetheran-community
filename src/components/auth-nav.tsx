"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NOTIFICATION_COUNT_EVENT } from "@/components/notification-count-sync";
import { createClient } from "@/lib/supabase/client";

function appRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export function AuthNav() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [unread, setUnread] = useState(0);
  const [hasCmsAccess, setHasCmsAccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refreshMemberState() {
      const { data: claimsData } = await supabase.auth.getClaims();
      const claims = claimsData?.claims;
      const connected = Boolean(claims);
      if (!active) return;
      setSignedIn(connected);
      if (!connected || !claims || typeof claims.sub !== "string") {
        setUnread(0);
        setHasCmsAccess(false);
        return;
      }

      const [{ count }, cmsResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null),
        appRole(claims.app_metadata) === "admin"
          ? Promise.resolve({ data: { user_id: claims.sub } })
          : supabase.from("cms_permissions").select("user_id").eq("user_id", claims.sub).maybeSingle(),
      ]);

      if (active) {
        setUnread(count ?? 0);
        setHasCmsAccess(Boolean(cmsResult.data));
      }
    }

    void refreshMemberState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      if (!session) {
        setUnread(0);
        setHasCmsAccess(false);
      } else {
        void refreshMemberState();
      }
    });

    const onFocus = () => void refreshMemberState();
    const onCount = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: unknown }>).detail;
      const nextCount = Number(detail?.count);
      if (Number.isFinite(nextCount) && nextCount >= 0) setUnread(Math.floor(nextCount));
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener(NOTIFICATION_COUNT_EVENT, onCount);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATION_COUNT_EVENT, onCount);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {signedIn && hasCmsAccess ? <Link className="topbar__utility" href="/redaction">Rédaction</Link> : null}
      {signedIn ? (
        <Link className="topbar__notifications" href="/notifications" aria-label={`${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}`}>
          Notifications
          {unread > 0 ? <span className="topbar__notification-count">{unread > 99 ? "99+" : unread}</span> : null}
        </Link>
      ) : null}
      <Link className="topbar__account" href={signedIn ? "/compte" : "/connexion"}>
        {signedIn === null ? "Compte" : signedIn ? "Mon compte" : "Connexion"}
      </Link>
    </>
  );
}
