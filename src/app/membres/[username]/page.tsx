import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { signedCharacterPortraitMap } from "@/lib/character-portraits";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "IM";
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)}` };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername).slice(0, 32);
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at")
    .ilike("username", username)
    .maybeSingle();

  if (error || !profile?.username) notFound();

  const [characterResult, topicResult] = await Promise.all([
    supabase
      .from("characters")
      .select("id, slug, name, epithet, short_summary, portrait_path, world, people, occupation, is_moderation_hidden")
      .eq("owner_id", profile.id)
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("is_moderation_hidden", false)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("forum_topics")
      .select("id, board_id, slug, title, last_activity_at, status")
      .eq("author_id", profile.id)
      .order("last_activity_at", { ascending: false })
      .limit(6),
  ]);

  const characters = characterResult.data ?? [];
  const topics = topicResult.data ?? [];
  const portraitMap = await signedCharacterPortraitMap(supabase, characters);
  const boardIds = Array.from(new Set(topics.map((topic) => topic.board_id)));
  const boardResult = boardIds.length
    ? await supabase.from("forum_boards").select("id, slug, title").in("id", boardIds)
    : { data: [] as { id: string; slug: string; title: string }[] };
  const boardMap = new Map((boardResult.data ?? []).map((board) => [board.id, board]));

  return (
    <main className="site-shell member-profile-page">
      <SiteHeader />

      <section className="member-profile-hero">
        <div className="content-frame">
          <p className="eyebrow">Membre d’Imetheran</p>
          <h1>{profile.display_name}</h1>
          <p>@{profile.username}</p>
        </div>
      </section>

      <section className="content-frame member-profile-workspace">
        <div className="member-profile-summary">
          <div className="member-profile-avatar" aria-hidden="true">{initials(profile.display_name)}</div>
          <div>
            <strong>{profile.display_name}</strong>
            <span>@{profile.username}</span>
            <small>Membre depuis le {formatDate(profile.created_at)}</small>
          </div>
          <Link className="button button--ghost button--small" href={`/recherche?q=${encodeURIComponent(profile.display_name)}`}>Rechercher ses contenus</Link>
        </div>

        {profile.bio ? <div className="member-profile-bio">{profile.bio}</div> : null}

        <div className="member-profile-columns">
          <section>
            <header className="member-profile-section-heading">
              <h2>Personnages</h2><span>{characters.length}</span>
            </header>
            {characters.length > 0 ? (
              <div className="member-profile-characters">
                {characters.map((character) => {
                  const portrait = portraitMap.get(character.id) ?? null;
                  return (
                    <Link href={`/personnages/${character.slug}`} key={character.id}>
                      <span className="member-profile-character__portrait" aria-hidden="true">
                        {portrait ? <img src={portrait} alt="" /> : initials(character.name)}
                      </span>
                      <div><strong>{character.name}</strong><span>{character.epithet || character.occupation || "Personnage RP"}</span></div>
                    </Link>
                  );
                })}
              </div>
            ) : <div className="member-profile-empty">Aucun personnage public.</div>}
          </section>

          <section>
            <header className="member-profile-section-heading">
              <h2>Sujets récents</h2><span>{topics.length}</span>
            </header>
            {topics.length > 0 ? (
              <div className="member-profile-topics">
                {topics.map((topic) => {
                  const board = boardMap.get(topic.board_id);
                  if (!board) return null;
                  return (
                    <Link href={`/forum/${board.slug}/sujet/${topic.slug}`} key={topic.id}>
                      <span>{board.title}</span>
                      <strong>{topic.title}</strong>
                    </Link>
                  );
                })}
              </div>
            ) : <div className="member-profile-empty">Aucun sujet public.</div>}
          </section>
        </div>

        <Link className="text-link" href="/membres">← Retour aux membres</Link>
      </section>
    </main>
  );
}
