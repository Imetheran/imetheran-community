import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { moderateCharacter } from "./actions";

export const dynamic = "force-dynamic";

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "draft") return "Brouillon";
  if (status === "archived") return "Archivée";
  return "Publiée";
}

function notice(message?: string, error?: string) {
  if (error === "motif") return { kind: "error", text: "Indiquez un motif de modération d’au moins 3 caractères." };
  if (error) return { kind: "error", text: "L’action n’a pas pu être enregistrée." };
  if (message) return { kind: "success", text: "La fiche personnage a été mise à jour." };
  return null;
}

export default async function AdminCharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fpersonnages");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const { data: characters, error } = await supabase
    .from("characters")
    .select("id, owner_id, slug, name, epithet, portrait_path, visibility, status, is_featured, is_moderation_hidden, moderation_note, moderated_at, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const rows = characters ?? [];
  const ownerIds = Array.from(new Set(rows.map((character) => character.owner_id)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ownerIds)
    : { data: [] as { id: string; display_name: string }[] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const pageNotice = notice(query.message, query.erreur);

  const publishedCount = rows.filter((character) => character.status === "published").length;
  const draftCount = rows.filter((character) => character.status === "draft").length;
  const hiddenCount = rows.filter((character) => character.is_moderation_hidden).length;
  const featuredCount = rows.filter((character) => character.is_featured).length;

  return (
    <main className="site-shell admin-page admin-characters-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · Personnages</p><h1>Fiches personnage</h1><p>Contrôlez la publication, les mises en avant et les éventuels masquages sans prendre la propriété des fiches aux membres.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">✦ Administrateur</span><Link className="button button--ghost button--small" href="/personnages">Voir le répertoire</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {pageNotice ? <div className={`admin-alert admin-alert--${pageNotice.kind}`} role="status">{pageNotice.text}</div> : null}
        {error ? <div className="admin-alert" role="alert">Les personnages n’ont pas pu être chargés depuis Supabase.</div> : null}

        <div className="admin-metrics" aria-label="Indicateurs personnages">
          <article className="admin-metric"><span>01</span><div><strong>{rows.length}</strong><small>Total</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{publishedCount}</strong><small>Publiés</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{draftCount}</strong><small>Brouillons</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{hiddenCount}</strong><small>Masqués</small></div></article>
        </div>

        <section className="admin-panel admin-character-panel" aria-labelledby="admin-character-list-title">
          <header className="admin-panel__head">
            <div><p className="eyebrow">Répertoire connecté</p><h2 id="admin-character-list-title">Tous les personnages</h2></div>
            <span className="admin-panel__status">{featuredCount} mis en avant</span>
          </header>

          {rows.length > 0 ? (
            <div className="admin-character-list">
              {rows.map((character) => {
                const portrait = character.portrait_path ? supabase.storage.from("character-portraits").getPublicUrl(character.portrait_path).data.publicUrl : null;
                return (
                  <article className={`admin-character-row${character.is_moderation_hidden ? " is-hidden" : ""}`} key={character.id}>
                    <div className="admin-character-row__identity">
                      <div className="admin-character-row__portrait" aria-hidden="true">{portrait ? <img src={portrait} alt="" /> : <span>{character.name.slice(0, 1).toUpperCase()}</span>}</div>
                      <div>
                        <div className="admin-character-row__badges">
                          <span>{statusLabel(character.status)}</span>
                          <span>{character.visibility}</span>
                          {character.is_featured ? <span>Mis en avant</span> : null}
                          {character.is_moderation_hidden ? <span>Masqué</span> : null}
                        </div>
                        <h3>{character.name}</h3>
                        <p>{character.epithet || "Sans épithète"}</p>
                        <small>{profileMap.get(character.owner_id) ?? "Membre"} · modifié {formatDate(character.updated_at)}</small>
                      </div>
                    </div>

                    {character.is_moderation_hidden && character.moderation_note ? <p className="admin-character-row__moderation-note"><strong>Motif :</strong> {character.moderation_note}</p> : null}

                    <div className="admin-character-row__actions">
                      <Link className="button button--ghost button--small" href={`/personnages/${character.slug}`}>Voir</Link>
                      <form action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value={character.is_featured ? "unfeature" : "feature"} />
                        <button className="button button--ghost button--small" type="submit" disabled={character.is_moderation_hidden || character.status !== "published"}>{character.is_featured ? "Retirer de la une" : "Mettre en avant"}</button>
                      </form>
                      <form action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value={character.status === "archived" ? "publish" : "archive"} />
                        <button className="button button--ghost button--small" type="submit">{character.status === "archived" ? "Republier" : "Archiver"}</button>
                      </form>
                    </div>

                    {character.is_moderation_hidden ? (
                      <form className="admin-character-row__moderation" action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value="restore" />
                        <span>Masquée depuis {formatDate(character.moderated_at)}</span>
                        <button className="button button--primary button--small" type="submit">Restaurer la fiche</button>
                      </form>
                    ) : (
                      <form className="admin-character-row__moderation" action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value="hide" />
                        <input name="reason" minLength={3} maxLength={1000} required placeholder="Motif interne du masquage…" />
                        <button className="button button--ghost button--small" type="submit">Masquer</button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          ) : <div className="admin-empty-state"><strong>Aucune fiche personnage en base.</strong><p>La première fiche créée par un membre apparaîtra ici automatiquement.</p></div>}
        </section>
      </section>
    </main>
  );
}
