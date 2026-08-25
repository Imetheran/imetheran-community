"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getClaims().then(({ data }) => {
      if (active) setSignedIn(Boolean(data?.claims));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Link className="topbar__account" href={signedIn ? "/compte" : "/connexion"}>
      {signedIn === null ? "Compte" : signedIn ? "Mon compte" : "Connexion"}
    </Link>
  );
}
