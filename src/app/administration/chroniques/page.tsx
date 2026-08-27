import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { chronicleNarrativeLabels, chroniclePublicationLabels, formatChronicleDate, getAppRole, type ChronicleNarrativeStatus, type ChroniclePublicationStatus } from "@/lib/chronicles";

export const dynamic = "force-dynamic";

export default async function AdminChroniclesPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fchroniques");
  if (getAppRole(claims.app_metadata) !== "admin") redirect("/compte");

  const [chroniclesResult, chaptersResult, participantsResult] = await Promise.all([
    supabase.from("chronicles").select("id, slug, title, subtitle, narrative_status, publication_status, featured, started_at, published_at, updated_at").order("updated_at", { ascending: false }),
    supabase.from("chronicle_chapters").select("id, chronicle_id"),
    supabase.from("chronicle_participants").select("id, chronicle_id"),
  ]);
  const rows = chroniclesResult.data ?? [];
  const chapterCount = new Map<string, number>();
  const participantCount = new Map<string, number>();
  for (const chapter of chaptersResult.data ?? []) chapterCount.set(chapter.chronicle_id, (chapterCount.get(chapter.chronicle_id) ?? 0) + 1);
  for (const participant of participantsResult.data ?? []) participantCount.set(participant.chronicle_id, (participantCount.get(participant.chronicle_id) ?? 0) + 1);
  const published = rows.filter((row) => row.publication_status === "published").length;
  const drafts = rows.filter((row) => row.publication_status === "draft").length;
  const archived = rows.filter((row) => row.publication_status === "archived").length;

  return (
    <main className="site-shell admin-page admin-chronicles-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · CMS</p><h1>Chroniques</h1><p>Créez les dossiers narratifs, organisez leurs actes, reliez les participants et publiez-les quand ils sont prêts.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge">✦ Administrateur</span><Link className="button button--primary button--small" href="/administration/chroniques/nouveau">Nouvelle chronique</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {chroniclesResult.error ? <div className="admin-alert" role="alert">Les chroniques n’ont pas pu être chargées depuis Supabase.</div> : null}
        <div className="admin-metrics" aria-label="Indicateurs Chroniques">
          <article className="admin-metric"><span>01</span><div><strong>{rows.length}</strong><small>Total</small></div></article>
          <article className="admin-metric"><span>02</span><div><strong>{drafts}</strong><small>Brouillons</small></div></article>
          <article className="admin-metric"><span>03</span><div><strong>{published}</strong><small>Publiées</small></div></article>
          <article className="admin-metric"><span>04</span><div><strong>{archived}</strong><small>Archivées</small></div></article>
        </div>

        <section className="admin-panel" aria-labelledby="admin-chronicles-list-title">
          <header className="admin-panel__head"><div><p className="eyebrow">Bibliothèque</p><h2 id="admin-chronicles-list-title">Tous les dossiers</h2></div><Link className="text-link" href="/chroniques">Voir le public →</Link></header>
          {rows.length ? (
            <div className="admin-chronicle-list">
              {rows.map((chronicle) => {
                const narrativeStatus = chronicle.narrative_status as ChronicleNarrativeStatus;
                const publicationStatus = chronicle.publication_status as ChroniclePublicationStatus;
                return (
                  <Link className="admin-chronicle-row" href={`/administration/chroniques/${chronicle.id}`} key={chronicle.id}>
                    <div className="admin-chronicle-row__badges">
                      <span>{chroniclePublicationLabels[publicationStatus]}</span>
                      <span>{chronicleNarrativeLabels[narrativeStatus]}</span>
                      {chronicle.featured ? <span>À la une</span> : null}
                    </div>
                    <div className="admin-chronicle-row__main"><strong>{chronicle.title}</strong><small>{chronicle.subtitle || chronicle.slug}</small></div>
                    <div className="admin-chronicle-row__stats"><span><strong>{chapterCount.get(chronicle.id) ?? 0}</strong> actes</span><span><strong>{participantCount.get(chronicle.id) ?? 0}</strong> participants</span></div>
                    <time dateTime={chronicle.updated_at}>{formatChronicleDate(chronicle.updated_at)}</time>
                    <span aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state"><strong>Aucune chronique en base.</strong><p>Créez le premier dossier. Il restera privé tant que vous ne le publiez pas.</p><Link className="button button--primary button--small" href="/administration/chroniques/nouveau">Créer la première chronique</Link></div>
          )}
        </section>
      </section>
    </main>
  );
}
