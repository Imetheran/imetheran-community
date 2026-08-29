import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { updatePrivacyRequest } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes de données",
  robots: { index: false, follow: false },
};

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

const typeLabels: Record<string, string> = {
  access: "Accès",
  rectification: "Rectification",
  deletion: "Suppression",
  objection: "Opposition",
  restriction: "Limitation",
  portability: "Portabilité",
  other: "Autre",
};

const statusLabels: Record<string, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  resolved: "Résolue",
  rejected: "Refusée",
};

export default async function PrivacyRequestsAdminPage({ searchParams }: { searchParams: Promise<{ message?: string; erreur?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims || typeof claims.sub !== "string") redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fdemandes-donnees");
  if (getRole(claims.app_metadata) !== "admin") redirect("/compte");

  const { data: requests, error } = await supabase
    .from("privacy_requests")
    .select("id, user_id, email, request_type, message, status, admin_note, created_at, updated_at, handled_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = requests ?? [];
  const openCount = list.filter((request) => request.status === "new" || request.status === "in_progress").length;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />
      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div><p className="eyebrow">Administration · RGPD</p><h1>Demandes de données</h1><p>Suivi interne des demandes d’accès, rectification, suppression et autres droits relatifs aux données personnelles.</p></div>
          <div className="admin-hero__side"><span className="admin-role-badge"><span aria-hidden="true">✦</span> {openCount} à traiter</span><Link className="button button--ghost button--small" href="/confidentialite">Voir la politique</Link></div>
        </div>
      </section>

      <section className="content-frame admin-workspace">
        <div className="legal-actions"><Link className="text-link" href="/administration">← Tableau de bord</Link><Link className="text-link" href="/confidentialite/demande">Formulaire public →</Link></div>
        {params.message === "enregistre" ? <div className="auth-message auth-message--success" role="status">Le suivi de la demande a été mis à jour.</div> : null}
        {params.erreur ? <div className="auth-message auth-message--error" role="alert">La mise à jour n’a pas pu être enregistrée.</div> : null}
        {error ? <div className="admin-alert" role="alert"><strong>Impossible de charger les demandes.</strong><span>Vérifiez la connexion Supabase et les politiques RLS.</span></div> : null}

        {list.length ? <div className="privacy-request-list">{list.map((request) => (
          <article className="privacy-request-card" key={request.id}>
            <div className="privacy-request-card__head">
              <div><strong>{typeLabels[request.request_type] ?? request.request_type}</strong> · <span>{statusLabels[request.status] ?? request.status}</span></div>
              <small>Reçue le {formatDate(request.created_at)}</small>
            </div>
            <p className="privacy-request-card__meta"><strong>Contact :</strong> {request.email}{request.user_id ? " · compte identifié" : " · demande sans session"}</p>
            <p>{request.message}</p>
            <form action={updatePrivacyRequest}>
              <input type="hidden" name="id" value={request.id} />
              <label>Statut<select name="status" defaultValue={request.status}><option value="new">Nouvelle</option><option value="in_progress">En cours</option><option value="resolved">Résolue</option><option value="rejected">Refusée</option></select></label>
              <label>Note interne<textarea name="admin_note" defaultValue={request.admin_note ?? ""} maxLength={4000} rows={4} /></label>
              <div className="privacy-request-card__meta">Dernière mise à jour : {formatDate(request.updated_at)} · clôture : {formatDate(request.handled_at)}</div>
              <button className="button button--primary button--small" type="submit">Enregistrer le suivi</button>
            </form>
          </article>
        ))}</div> : <div className="admin-empty-state"><strong>Aucune demande pour le moment.</strong><p>Les demandes envoyées via le formulaire de confidentialité apparaîtront ici.</p></div>}
      </section>
    </main>
  );
}
