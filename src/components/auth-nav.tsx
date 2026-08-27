"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
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
