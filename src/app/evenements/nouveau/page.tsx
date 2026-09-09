import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { createCommunityEvent } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fevenements%2Fnouveau");
  }

  const [chronicleResult, topicResult] = await Promise.all([
    supabase
      .from("chronicles")
      .select("id, title")
      .eq("publication_status", "published")
      .order("title")
      .limit(100),
    supabase
      .from("forum_topics")
      .select("id, title")
      .eq("author_id", userId)
      .order("last_activity_at", { ascending: false })
      .limit(40),
  ]);

  const errorMessage = query.erreur === "champs"
    ? "Vérifiez le titre et les dates."
    : query.erreur === "suspendu"
      ? "Votre participation est actuellement suspendue."
      : query.erreur
        ? "L’événement n’a pas pu être créé."
        : null;

  return (
    <main className="site-shell event-create-page">
      <SiteHeader />

      <section className="event-create-hero">
        <div className="content-frame">
          <p className="eyebrow">Agenda communautaire</p>
          <h1>Nouvel événement</h1>
        </div>
      </section>

      <section className="content-frame event-create-workspace">
        {errorMessage ? <div className="tools-notice tools-notice--error">{errorMessage}</div> : null}
        <form className="event-create-form" action={createCommunityEvent}>
          <div className="event-create-grid event-create-grid--two">
            <label><span>Titre</span><input name="title" maxLength={120} required /></label>
            <label><span>Type</span><select name="event_type" defaultValue="rp"><option value="rp">Rôleplay</option><option value="hrp">Hors-RP</option></select></label>
          </div>

          <div className="event-create-grid event-create-grid--two">
            <label><span>Début</span><input name="starts_at" type="datetime-local" required /></label>
            <label><span>Fin</span><input name="ends_at" type="datetime-local" /></label>
          </div>

          <div className="event-create-grid event-create-grid--two">
            <label><span>Lieu</span><input name="location" maxLength={140} placeholder="En jeu, Discord, forum…" /></label>
            <label><span>Places</span><input name="capacity" type="number" min={1} max={200} placeholder="Illimité" /></label>
          </div>

          <label><span>Description</span><textarea name="description" rows={6} maxLength={4000} /></label>

          <div className="event-create-grid event-create-grid--two">
            <label>
              <span>Chronique liée</span>
              <select name="related_chronicle_id" defaultValue="">
                <option value="">Aucune</option>
                {(chronicleResult.data ?? []).map((chronicle) => <option value={chronicle.id} key={chronicle.id}>{chronicle.title}</option>)}
              </select>
            </label>
            <label>
              <span>Sujet forum lié</span>
              <select name="related_topic_id" defaultValue="">
                <option value="">Aucun</option>
                {(topicResult.data ?? []).map((topic) => <option value={topic.id} key={topic.id}>{topic.title}</option>)}
              </select>
            </label>
          </div>

          <label><span>Visibilité</span><select name="visibility" defaultValue="public"><option value="public">Public</option><option value="members">Membres uniquement</option></select></label>

          <div className="event-create-actions">
            <Link className="button button--ghost" href="/evenements">Annuler</Link>
            <button className="button button--primary" type="submit">Créer l’événement</button>
          </div>
        </form>
      </section>
    </main>
  );
}
