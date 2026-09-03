"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NOTIFICATION_COUNT_EVENT } from "@/components/notification-count-sync";
import { createClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function refreshUnread() {
      const { data: claimsData } = await supabase.auth.getClaims();
      const connected = Boolean(claimsData?.claims);
      if (!active) return;
      setSignedIn(connected);
      if (!connected) {
        setUnread(0);
        return;
      }

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (active) setUnread(count ?? 0);
    }

    void refreshUnread();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      if (!session) setUnread(0);
      else void refreshUnread();
    });

    const onFocus = () => void refreshUnread();
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
