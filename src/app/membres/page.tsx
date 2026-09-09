import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membres",
};

const pageSize = 36;

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

function safeSearch(value: string) {
  return value.replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().slice(0, 48);
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = safeSearch(String(params.q ?? ""));
  const requestedPage = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const supabase = await createClient();

  let request = supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at", { count: "exact" })
    .not("username", "is", null)
    .order("display_name", { ascending: true });

  if (query) {
    request = request.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
  }

  const from = (requestedPage - 1) * pageSize;
  const { data, count, error } = await request.range(from, from + pageSize - 1);
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const profiles = data ?? [];

  const ownerIds = profiles.map((profile) => profile.id);
  const characterCounts = new Map<string, number>();
  if (ownerIds.length > 0) {
    const { data: characters } = await supabase
      .from("characters")
      .select("owner_id")
      .in("owner_id", ownerIds)
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("is_moderation_hidden", false);
    for (const character of characters ?? []) {
      characterCounts.set(character.owner_id, (characterCounts.get(character.owner_id) ?? 0) + 1);
    }
  }

  return (
    <main className="site-shell members-page">
      <SiteHeader />

      <section className="members-hero">
        <div className="content-frame">
          <p className="eyebrow">Communauté</p>
          <h1>Membres</h1>
        </div>
      </section>

      <section className="content-frame member-directory-workspace">
        <div className="member-directory-toolbar">
          <form className="member-directory-search" method="get" action="/membres">
            <label className="sr-only" htmlFor="member-search">Rechercher un membre</label>
            <input id="member-search" name="q" type="search" defaultValue={query} placeholder="Nom ou @identifiant" />
            <button className="button button--ghost button--small" type="submit">Rechercher</button>
          </form>
          <span className="status-pill status-pill--quiet">{total} membre{total > 1 ? "s" : ""}</span>
        </div>

        {error ? (
          <div className="tools-notice tools-notice--error">L’annuaire n’a pas pu être chargé.</div>
        ) : profiles.length > 0 ? (
          <div className="member-directory-grid">
            {profiles.map((profile) => {
              const username = String(profile.username ?? "");
              const countCharacters = characterCounts.get(profile.id) ?? 0;
              return (
                <Link className="member-card" href={`/membres/${encodeURIComponent(username)}`} key={profile.id}>
                  <span className="member-card__avatar" aria-hidden="true">{initials(profile.display_name)}</span>
                  <div className="member-card__identity">
                    <strong>{profile.display_name}</strong>
                    <span>@{username}</span>
                  </div>
                  <small>{countCharacters} personnage{countCharacters > 1 ? "s" : ""}</small>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="tools-empty">
            <h3>{query ? "Aucun membre trouvé" : "Aucun profil public"}</h3>
            {query ? <Link className="button button--ghost" href="/membres">Réinitialiser</Link> : null}
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="member-directory-pagination" aria-label="Pagination des membres">
            {page > 1 ? <Link href={`/membres?${query ? `q=${encodeURIComponent(query)}&` : ""}page=${page - 1}`}>←</Link> : <span />}
            <strong>{page} / {pageCount}</strong>
            {page < pageCount ? <Link href={`/membres?${query ? `q=${encodeURIComponent(query)}&` : ""}page=${page + 1}`}>→</Link> : <span />}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
