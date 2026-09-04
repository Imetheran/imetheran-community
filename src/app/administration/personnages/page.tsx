import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { signedCharacterPortraitMap } from "@/lib/character-portraits";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "../confirm-delete-button";
import destructiveStyles from "../destructive-actions.module.css";
import { deleteCharacter, moderateCharacter } from "./actions";

export const dynamic = "force-dynamic";

type Search = {
  message?: string;
  erreur?: string;
  q?: string;
  statut?: string;
  visibilite?: string;
  moderation?: string;
};

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "draft") return "Brouillon";
  if (status === "archived") return "Archivée";
  return "Publiée";
}

function visibilityLabel(visibility: string) {
  if (visibility === "public") return "Publique";
  if (visibility === "unlisted") return "Non listée";
  return "Privée";
}

function notice(message?: string, error?: string) {
  if (error === "motif") return { kind: "error", text: "Indiquez un motif de modération d’au moins 3 caractères." };
  if (error === "introuvable") return { kind: "error", text: "Cette fiche personnage n’existe plus." };
  if (error === "suppression") return { kind: "error", text: "La fiche n’a pas pu être supprimée définitivement." };
  if (error) return { kind: "error", text: "L’action n’a pas pu être enregistrée." };
  if (message === "supprime") return { kind: "success", text: "La fiche personnage et ses données liées ont été supprimées définitivement." };
  if (message === "supprime-stockage") return { kind: "success", text: "La fiche a été supprimée. Le nettoyage de son portrait stocké devra être vérifié." };
  if (message) return { kind: "success", text: "La fiche personnage a été mise à jour." };
  return null;
}

export default async function AdminCharactersPage({ searchParams }: { searchParams: Promise<Search> }) {
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
    .limit(250);

  const rows = characters ?? [];
  const ownerIds = Array.from(new Set(rows.map((character) => character.owner_id)));
  const { data: profiles } = ownerIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ownerIds)
    : { data: [] as { id: string; display_name: string }[] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const portraitMap = await signedCharacterPortraitMap(supabase, rows);
  const pageNotice = notice(query.message, query.erreur);

  const publishedCount = rows.filter((character) => character.status === "published").length;
  const draftCount = rows.filter((character) => character.status === "draft").length;
  const hiddenCount = rows.filter((character) => character.is_moderation_hidden).length;
  const featuredCount = rows.filter((character) => character.is_featured).length;

  const search = String(query.q ?? "").trim().slice(0, 120);
  const status = String(query.statut ?? "").trim();
  const visibility = String(query.visibilite ?? "").trim();
  const moderation = String(query.moderation ?? "").trim();
  const needle = search.toLocaleLowerCase("fr");

  const filteredRows = rows.filter((character) => {
    const ownerName = profileMap.get(character.owner_id) ?? "";
    const matchesSearch = !needle || `${character.name} ${character.epithet ?? ""} ${character.slug} ${ownerName}`.toLocaleLowerCase("fr").includes(needle);
    const matchesStatus = !status || character.status === status;
    const matchesVisibility = !visibility || character.visibility === visibility;
    const matchesModeration = !moderation
      || (moderation === "hidden" && character.is_moderation_hidden)
      || (moderation === "visible" && !character.is_moderation_hidden)
      || (moderation === "featured" && character.is_featured);
    return matchesSearch && matchesStatus && matchesVisibility && matchesModeration;
  });

  const hasFilters = Boolean(search || status || visibility || moderation);

  return (
    <main className="site-shell admin-page admin-characters-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration · Personnages</p>
            <h1>Fiches personnage</h1>
            <p>Contrôlez la publication, la visibilité, les mises en avant et la modération sans prendre la propriété des fiches aux membres.</p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge">✦ Administrateur</span>
            <Link className="button button--ghost button--small" href="/personnages">Voir le répertoire</Link>
          </div>
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

          <form className="admin-cms-filters" method="get">
            <label>
              <span>Recherche</span>
              <input name="q" type="search" defaultValue={search} placeholder="Personnage, propriétaire ou slug…" />
            </label>
            <label>
              <span>Publication</span>
              <select name="statut" defaultValue={status}>
                <option value="">Toutes</option>
                <option value="draft">Brouillons</option>
                <option value="published">Publiées</option>
                <option value="archived">Archivées</option>
              </select>
            </label>
            <label>
              <span>Visibilité</span>
              <select name="visibilite" defaultValue={visibility}>
                <option value="">Toutes</option>
                <option value="public">Publiques</option>
                <option value="unlisted">Non listées</option>
                <option value="private">Privées</option>
              </select>
            </label>
            <label>
              <span>Modération</span>
              <select name="moderation" defaultValue={moderation}>
                <option value="">Toutes</option>
                <option value="visible">Non masquées</option>
                <option value="hidden">Masquées</option>
                <option value="featured">Mises en avant</option>
              </select>
            </label>
            <button className="button button--ghost button--small" type="submit">Filtrer</button>
            {hasFilters ? <Link className="text-link" href="/administration/personnages">Réinitialiser</Link> : null}
          </form>

          <p className="admin-filter-result">{filteredRows.length} résultat{filteredRows.length > 1 ? "s" : ""} sur {rows.length}</p>

          {filteredRows.length > 0 ? (
            <div className="admin-character-list">
              {filteredRows.map((character) => {
                const portrait = portraitMap.get(character.id) ?? null;
                const ownerName = profileMap.get(character.owner_id) ?? "Membre";
                return (
                  <article className={`admin-character-row${character.is_moderation_hidden ? " is-hidden" : ""}`} key={character.id}>
                    <div className="admin-character-row__identity">
                      <div className="admin-character-row__portrait" aria-hidden="true">
                        {portrait ? <img src={portrait} alt="" /> : <span>{character.name.slice(0, 1).toUpperCase()}</span>}
                      </div>
                      <div>
                        <div className="admin-character-row__badges">
                          <span>{statusLabel(character.status)}</span>
                          <span>{visibilityLabel(character.visibility)}</span>
                          {character.is_featured ? <span>Mis en avant</span> : null}
                          {character.is_moderation_hidden ? <span>Masqué</span> : null}
                        </div>
                        <h3>{character.name}</h3>
                        <p>{character.epithet || "Sans épithète"}</p>
                        <small>{ownerName} · modifié {formatDate(character.updated_at)}</small>
                      </div>
                    </div>

                    {character.is_moderation_hidden && character.moderation_note ? (
                      <p className="admin-character-row__moderation-note"><strong>Motif :</strong> {character.moderation_note}</p>
                    ) : null}

                    <div className="admin-character-row__actions">
                      <Link className="button button--ghost button--small" href={`/personnages/${character.slug}`}>Voir</Link>
                      <form action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value={character.is_featured ? "unfeature" : "feature"} />
                        <button className="button button--ghost button--small" type="submit" disabled={character.is_moderation_hidden || character.status !== "published"}>
                          {character.is_featured ? "Retirer de la une" : "Mettre en avant"}
                        </button>
                      </form>
                      <form action={moderateCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <input type="hidden" name="action" value={character.status === "archived" ? "publish" : "archive"} />
                        <button className="button button--ghost button--small" type="submit">
                          {character.status === "archived" ? "Republier" : "Archiver"}
                        </button>
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

                    <div className={destructiveStyles.memberDanger}>
                      <div className={destructiveStyles.memberDangerText}>
                        <strong>Suppression définitive</strong>
                        <small>Supprime la fiche, ses relations et son portrait. Les messages de forum restent en place mais ne seront plus associés à ce personnage.</small>
                      </div>
                      <form action={deleteCharacter}>
                        <input type="hidden" name="character_id" value={character.id} />
                        <ConfirmDeleteButton
                          className={`button button--small ${destructiveStyles.dangerButton}`}
                          label="Supprimer la fiche"
                          confirmMessage={`Supprimer définitivement ${character.name} ?\n\nLa fiche, ses relations et son portrait seront supprimés. Les messages du forum resteront publiés sans association au personnage. Cette action est irréversible.`}
                        />
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>{rows.length ? "Aucune fiche ne correspond aux filtres." : "Aucune fiche personnage en base."}</strong>
              <p>{rows.length ? "Élargissez la recherche ou réinitialisez les filtres." : "La première fiche créée par un membre apparaîtra ici automatiquement."}</p>
              {rows.length ? <Link className="text-link" href="/administration/personnages">Réinitialiser les filtres →</Link> : null}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
