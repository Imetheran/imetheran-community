import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { deleteNotification, markAllNotificationsRead, openNotification } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Suivez les réponses, annonces et demandes liées à votre activité sur Imetheran.",
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

const typeLabels: Record<string, string> = {
  forum_reply: "Forum",
  announcement: "Annonce",
  relationship_request: "Relation",
  relationship_approved: "Relation validée",
  relationship_rejected: "Relation refusée",
  relationship_revision: "Révision",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; erreur?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fnotifications");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(150);

  const notifications = (data ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <main className="site-shell notifications-page">
      <SiteHeader />

      <section className="tools-hero">
        <div className="content-frame tools-hero__layout">
          <div>
            <p className="eyebrow">Espace membre</p>
            <h1>Notifications</h1>
            <p>Réponses suivies, annonces importantes et décisions concernant les relations de vos personnages.</p>
          </div>
          <div className="tools-hero__side">
            <span className="status-pill">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
            <Link className="button button--ghost button--small" href="/compte">Mon compte</Link>
          </div>
        </div>
      </section>

      <section className="content-frame tools-workspace">
        {query.message === "lus" ? <div className="tools-notice" role="status">Toutes les notifications ont été marquées comme lues.</div> : null}
        {query.message === "supprimee" ? <div className="tools-notice" role="status">Notification supprimée.</div> : null}
        {query.erreur ? <div className="tools-notice tools-notice--error" role="alert">L’action demandée n’a pas pu être enregistrée.</div> : null}
        {error ? <div className="tools-notice tools-notice--error" role="alert">Les notifications n’ont pas pu être chargées.</div> : null}

        <header className="tools-section-heading">
          <div>
            <p className="eyebrow">Activité récente</p>
            <h2>Votre fil personnel</h2>
          </div>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsRead}>
              <button className="button button--ghost button--small" type="submit">Tout marquer comme lu</button>
            </form>
          ) : null}
        </header>

        {notifications.length ? (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article className={`notification-card${notification.read_at ? "" : " notification-card--unread"}`} key={notification.id}>
                <div className="notification-card__marker" aria-hidden="true">{notification.read_at ? "○" : "●"}</div>
                <div className="notification-card__content">
                  <div className="notification-card__meta">
                    <span>{typeLabels[notification.type] ?? "Imetheran"}</span>
                    <time dateTime={notification.created_at}>{formatDate(notification.created_at)}</time>
                  </div>
                  <h3>{notification.title}</h3>
                  <p>{notification.body}</p>
                </div>
                <div className="notification-card__actions">
                  <form action={openNotification}>
                    <input type="hidden" name="notification_id" value={notification.id} />
                    <button className="button button--primary button--small" type="submit">Ouvrir</button>
                  </form>
                  <form action={deleteNotification}>
                    <input type="hidden" name="notification_id" value={notification.id} />
                    <button className="notification-delete" type="submit" aria-label={`Supprimer : ${notification.title}`}>Supprimer</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="tools-empty">
            <span aria-hidden="true">✦</span>
            <h3>Aucune notification pour le moment</h3>
            <p>Suivez un sujet du forum ou créez des relations entre personnages : les événements qui vous concernent apparaîtront ici.</p>
            <div className="tools-empty__actions">
              <Link className="button button--primary" href="/forum">Parcourir le forum</Link>
              <Link className="button button--ghost" href="/liens">Voir les liens</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
