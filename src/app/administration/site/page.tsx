import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { readSiteRuntimeSettings } from "@/lib/site-runtime";
import { createClient } from "@/lib/supabase/server";
import { setMaintenanceMode } from "../actions";

export const dynamic = "force-dynamic";

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function formatDate(value: string | null) {
  if (!value) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export default async function AdministrationSitePage({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fsite");
  }
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const settings = await readSiteRuntimeSettings();
  const maintenanceEnabled = settings.maintenanceEnabled;
  const feedback =
    query.etat === "maintenance"
      ? { tone: "maintenance", title: "Mode maintenance activé", text: "Le site public redirige maintenant vers la page de maintenance." }
      : query.etat === "online"
        ? { tone: "online", title: "Site remis en ligne", text: "L’accès public normal à Imetheran est rétabli." }
        : query.etat === "erreur"
          ? { tone: "error", title: "Changement non appliqué", text: "Le réglage n’a pas pu être enregistré. Vérifiez Supabase puis réessayez." }
          : null;

  return (
    <main className="site-shell admin-page admin-site-page">
      <SiteHeader />

      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <p className="eyebrow">Administration · Site</p>
            <h1>Accès public</h1>
            <p>Contrôlez l’ouverture d’Imetheran et gardez un accès sûr aux outils internes pendant une intervention.</p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge">{maintenanceEnabled ? "Maintenance active" : "Site en ligne"}</span>
            <Link className="button button--ghost button--small" href="/administration">← Tableau de bord</Link>
          </div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        {feedback ? (
          <div className={`admin-feedback admin-feedback--${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"}>
            <strong>{feedback.title}</strong>
            <span>{feedback.text}</span>
          </div>
        ) : null}

        <div className="admin-site-layout">
          <section className={`admin-site-control admin-site-control--page ${maintenanceEnabled ? "is-maintenance" : "is-online"}`} aria-labelledby="site-state-title">
            <div className="admin-site-control__status">
              <span className="admin-site-control__dot" aria-hidden="true" />
              <div>
                <small id="site-state-title">État actuel</small>
                <strong>{maintenanceEnabled ? "Maintenance" : "En ligne"}</strong>
              </div>
            </div>

            <p>
              {maintenanceEnabled
                ? "Les visiteurs sont redirigés vers la page de maintenance. L’administration, l’authentification et l’espace rédaction restent accessibles afin de poursuivre les interventions."
                : "Le site est accessible normalement aux visiteurs et aux membres. Activez la maintenance uniquement lorsqu’une intervention nécessite de fermer temporairement l’accès public."}
            </p>

            <div className="admin-site-control__actions">
              <form action={setMaintenanceMode}>
                <input type="hidden" name="enabled" value={maintenanceEnabled ? "false" : "true"} />
                <input type="hidden" name="return_to" value="/administration/site" />
                <button className="admin-site-control__button" type="submit">
                  {maintenanceEnabled ? "Remettre le site en ligne" : "Activer la maintenance"}
                </button>
              </form>
              <Link className="text-link" href="/maintenance" target="_blank" rel="noopener noreferrer">Prévisualiser la page ↗</Link>
            </div>

            <small>
              {settings.source === "database"
                ? `Réglage Supabase · dernière mise à jour ${formatDate(settings.updatedAt)}`
                : "Réglage de secours actif · la lecture Supabase doit être vérifiée"}
            </small>
          </section>

          <section className="admin-site-behaviour" aria-labelledby="maintenance-behaviour-title">
            <header>
              <p className="eyebrow">Pendant la maintenance</p>
              <h2 id="maintenance-behaviour-title">Ce qui reste accessible</h2>
            </header>
            <div className="admin-site-behaviour__list">
              <div><i aria-hidden="true" /><div><strong>Administration</strong><small>Les administrateurs et modérateurs peuvent continuer à gérer le site.</small></div></div>
              <div><i aria-hidden="true" /><div><strong>Espace rédaction</strong><small>Les contributeurs et éditeurs autorisés peuvent continuer à travailler sur les contenus CMS.</small></div></div>
              <div><i aria-hidden="true" /><div><strong>Connexion</strong><small>L’authentification reste disponible pour permettre l’accès aux espaces internes.</small></div></div>
              <div><i aria-hidden="true" /><div><strong>Site public</strong><small>Les autres pages redirigent vers la page de maintenance jusqu’à la remise en ligne.</small></div></div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
