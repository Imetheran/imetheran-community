import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { AdminBreadcrumbs } from "../../admin-breadcrumbs";
import { ConfirmDeleteButton } from "../../confirm-delete-button";
import destructiveStyles from "../../destructive-actions.module.css";
import { createForumBoard, createForumSection, updateForumBoard, updateForumSection } from "./actions";
import { deleteForumBoard, deleteForumSection } from "./delete-actions";
import styles from "./structure.module.css";

export const dynamic = "force-dynamic";

type SectionRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  mode: "rp" | "non-rp";
  access_scope: "guest-read" | "members";
  sort_order: number;
  is_active: boolean;
};

type BoardRow = {
  id: string;
  section_id: string;
  slug: string;
  title: string;
  description: string;
  badge: string | null;
  topic_creation: "members" | "staff" | "closed";
  reply_policy: "members" | "staff" | "closed";
  sort_order: number;
  is_active: boolean;
};

type TopicSummary = { id: string; board_id: string; post_count: number };
type Search = { message?: string; erreur?: string };

function roleFromMetadata(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

function accessLabel(value: SectionRow["access_scope"]) {
  return value === "guest-read" ? "Lecture invités" : "Membres uniquement";
}

function policyLabel(value: BoardRow["topic_creation"] | BoardRow["reply_policy"]) {
  if (value === "staff") return "Équipe uniquement";
  if (value === "closed") return "Fermé";
  return "Tous les membres";
}

const SUCCESS_MESSAGES: Record<string, string> = {
  "section-creee": "La catégorie a été créée.",
  "section-maj": "La catégorie a été mise à jour.",
  "section-archivee": "La catégorie est maintenant archivée et masquée du forum public.",
  "section-supprimee": "La catégorie, ses forums et tout leur contenu ont été supprimés définitivement.",
  "section-supprimee-stockage": "La catégorie et son contenu ont été supprimés. Une partie du nettoyage des médias stockés doit être vérifiée.",
  "forum-cree": "Le forum a été créé.",
  "forum-maj": "Le forum a été mis à jour.",
  "forum-archive": "Le forum est maintenant archivé et masqué du forum public.",
  "forum-supprime": "Le forum, ses sujets et ses messages ont été supprimés définitivement.",
  "forum-supprime-stockage": "Le forum et son contenu ont été supprimés. Une partie du nettoyage des médias stockés doit être vérifiée.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "section-donnees": "Vérifiez les informations de la catégorie.",
  "section-creation": "La catégorie n’a pas pu être créée.",
  "section-introuvable": "La catégorie demandée est introuvable.",
  "section-maj": "La catégorie n’a pas pu être mise à jour.",
  "section-suppression": "La catégorie n’a pas pu être supprimée définitivement.",
  "forum-donnees": "Vérifiez les informations du forum.",
  "forum-creation": "Le forum n’a pas pu être créé.",
  "forum-introuvable": "Le forum demandé est introuvable.",
  "forum-maj": "Le forum n’a pas pu être mis à jour.",
  "forum-suppression": "Le forum n’a pas pu être supprimé définitivement.",
  "suppression-media": "Les médias liés n’ont pas pu être préparés pour la suppression. La structure a été conservée.",
  slug: "Impossible de générer un identifiant d’URL unique.",
  "mode-contenu": "Le mode RP / hors-RP ne peut plus être changé sur une catégorie contenant déjà des sujets.",
  "deplacement-mode": "Un forum contenant déjà des sujets ne peut pas être déplacé entre une catégorie RP et hors-RP.",
};

export default async function ForumStructurePage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claimsError || !claims || typeof claims.sub !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fadministration%2Fforum%2Fstructure");
  }

  const role = roleFromMetadata(claims.app_metadata);
  if (role !== "admin" && role !== "moderator") redirect("/compte");
  const canEdit = role === "admin";

  const [sectionsResult, boardsResult, topicsResult] = await Promise.all([
    supabase.from("forum_sections").select("id, slug, title, subtitle, mode, access_scope, sort_order, is_active").order("sort_order").order("title"),
    supabase.from("forum_boards").select("id, section_id, slug, title, description, badge, topic_creation, reply_policy, sort_order, is_active").order("sort_order").order("title"),
    supabase.from("forum_topics").select("id, board_id, post_count"),
  ]);

  const sections = (sectionsResult.data ?? []) as SectionRow[];
  const boards = (boardsResult.data ?? []) as BoardRow[];
  const topics = (topicsResult.data ?? []) as TopicSummary[];
  const boardStats = new Map<string, { topics: number; posts: number }>();
  for (const topic of topics) {
    const current = boardStats.get(topic.board_id) ?? { topics: 0, posts: 0 };
    current.topics += 1;
    current.posts += topic.post_count ?? 0;
    boardStats.set(topic.board_id, current);
  }

  const activeSections = sections.filter((section) => section.is_active).length;
  const activeBoards = boards.filter((board) => board.is_active).length;
  const staffOnlyBoards = boards.filter((board) => board.topic_creation === "staff" || board.reply_policy === "staff").length;
  const closedBoards = boards.filter((board) => board.topic_creation === "closed" || board.reply_policy === "closed").length;
  const loadError = sectionsResult.error || boardsResult.error || topicsResult.error;

  return (
    <main className="site-shell admin-page">
      <SiteHeader />

      <section className="admin-hero">
        <div className="content-frame admin-hero__layout">
          <div>
            <AdminBreadcrumbs items={[{ label: "Forum", href: "/administration/forum" }, { label: "Structure" }]} />
            <p className="eyebrow">Administration · Forum</p>
            <h1>Structure & permissions</h1>
            <p>Visualisez d’abord l’arborescence. Ouvrez uniquement la catégorie ou le forum que vous souhaitez modifier.</p>
          </div>
          <div className="admin-hero__side">
            <span className="admin-role-badge"><span aria-hidden="true">✦</span> {canEdit ? "Administrateur" : "Modérateur · lecture seule"}</span>
            <Link className="button button--ghost button--small" href="/administration/forum">Modération</Link>
            <Link className="button button--ghost button--small" href="/forum">Voir le forum</Link>
          </div>
        </div>
      </section>

      <section className={`content-frame admin-workspace ${styles.workspace}`}>
        {loadError ? <div className="admin-alert" role="alert"><strong>Données partielles</strong><span>La structure du forum n’a pas pu être chargée complètement.</span></div> : null}
        {query.message && SUCCESS_MESSAGES[query.message] ? <div className={styles.notice} role="status">{SUCCESS_MESSAGES[query.message]}</div> : null}
        {query.erreur ? <div className={`${styles.notice} ${styles.noticeError}`} role="alert">{ERROR_MESSAGES[query.erreur] ?? "L’action n’a pas pu être enregistrée."}</div> : null}

        <div className={styles.metrics}>
          <article><span>Catégories actives</span><strong>{activeSections}</strong></article>
          <article><span>Forums actifs</span><strong>{activeBoards}</strong></article>
          <article><span>Règle staff</span><strong>{staffOnlyBoards}</strong></article>
          <article><span>Lecture seule</span><strong>{closedBoards}</strong></article>
        </div>

        <details className={styles.policyGuide}>
          <summary><div><p className="eyebrow">Aide</p><strong>Comprendre les permissions</strong></div><span>Afficher le guide</span></summary>
          <div className={styles.policyGrid}>
            <article><strong>Lecture invités</strong><p>Les visiteurs voient les sujets et messages de la catégorie sans compte.</p></article>
            <article><strong>Membres uniquement</strong><p>La structure reste visible, mais le contenu est protégé jusqu’à la connexion.</p></article>
            <article><strong>Équipe uniquement</strong><p>Admins et modérateurs peuvent créer ou répondre selon le réglage du forum.</p></article>
            <article><strong>Fermé</strong><p>Aucune nouvelle création ou réponse, y compris pour l’équipe. Idéal pour la lecture seule.</p></article>
          </div>
        </details>

        {canEdit ? (
          <details className={styles.createSection}>
            <summary>+ Créer une nouvelle catégorie</summary>
            <form action={createForumSection} className={styles.formGrid}>
              <label className={styles.wide}><span>Nom</span><input name="title" minLength={2} maxLength={100} required placeholder="Nouvelle campagne" /></label>
              <label className={styles.wide}><span>Description</span><textarea name="subtitle" rows={3} maxLength={600} placeholder="À quoi sert cette catégorie ?" /></label>
              <label><span>Nature</span><select name="mode" defaultValue="rp"><option value="rp">Rôleplay</option><option value="non-rp">Hors-RP</option></select></label>
              <label><span>Lecture</span><select name="access_scope" defaultValue="members"><option value="members">Membres uniquement</option><option value="guest-read">Lecture invités</option></select></label>
              <div className={styles.formAction}><button className="button button--primary button--small" type="submit">Créer la catégorie</button></div>
            </form>
          </details>
        ) : null}

        <div className={styles.treeHeading}>
          <div><p className="eyebrow">Arborescence</p><h2>{sections.length} catégorie{sections.length > 1 ? "s" : ""}</h2></div>
          <span>Les réglages restent fermés tant que vous ne les ouvrez pas.</span>
        </div>

        <div className={styles.sectionList}>
          {sections.map((section) => {
            const sectionBoards = boards.filter((board) => board.section_id === section.id);
            const sectionStats = sectionBoards.reduce((total, board) => {
              const stats = boardStats.get(board.id) ?? { topics: 0, posts: 0 };
              return { topics: total.topics + stats.topics, posts: total.posts + stats.posts };
            }, { topics: 0, posts: 0 });

            return (
              <article className={`${styles.sectionCard}${section.is_active ? "" : ` ${styles.archived}`}`} key={section.id}>
                <header className={styles.sectionHeader}>
                  <div>
                    <div className={styles.badges}>
                      <span>{section.mode === "rp" ? "RP" : "Hors-RP"}</span>
                      <span>{accessLabel(section.access_scope)}</span>
                      {!section.is_active ? <span>Archivée</span> : null}
                    </div>
                    <h2>{section.title}</h2>
                    <p>{section.subtitle || "Aucune description."}</p>
                    <div className={styles.sectionFacts}><span><strong>{sectionBoards.length}</strong> forums</span><span><strong>{sectionStats.topics}</strong> sujets</span><span><strong>{sectionStats.posts}</strong> messages</span><span>Position {section.sort_order}</span></div>
                  </div>
                  <div className={styles.headerTools}><code>{section.slug}</code>{canEdit ? <span>Réglages disponibles ↓</span> : null}</div>
                </header>

                {canEdit ? (
                  <details className={styles.sectionEditor}>
                    <summary>Modifier la catégorie</summary>
                    <form action={updateForumSection} className={styles.formGrid}>
                      <input type="hidden" name="section_id" value={section.id} />
                      <label className={styles.wide}><span>Nom</span><input name="title" defaultValue={section.title} minLength={2} maxLength={100} required /></label>
                      <label className={styles.wide}><span>Description</span><textarea name="subtitle" defaultValue={section.subtitle} rows={3} maxLength={600} /></label>
                      <label><span>Nature</span><select name="mode" defaultValue={section.mode}><option value="rp">Rôleplay</option><option value="non-rp">Hors-RP</option></select></label>
                      <label><span>Lecture</span><select name="access_scope" defaultValue={section.access_scope}><option value="members">Membres uniquement</option><option value="guest-read">Lecture invités</option></select></label>
                      <label><span>Position</span><input name="sort_order" type="number" min={0} max={9999} defaultValue={section.sort_order} required /></label>
                      <label><span>État</span><select name="status" defaultValue={section.is_active ? "active" : "archived"}><option value="active">Active</option><option value="archived">Archivée</option></select></label>
                      <div className={styles.formAction}><button className="button button--primary button--small" type="submit">Enregistrer la catégorie</button></div>
                    </form>
                    <div className={destructiveStyles.memberDanger}>
                      <div className={destructiveStyles.memberDangerText}>
                        <strong>Supprimer définitivement la catégorie</strong>
                        <small>Supprime les {sectionBoards.length} forum{sectionBoards.length > 1 ? "s" : ""}, {sectionStats.topics} sujet{sectionStats.topics > 1 ? "s" : ""}, {sectionStats.posts} message{sectionStats.posts > 1 ? "s" : ""} et leurs médias. Archivez-la plutôt si son historique doit être conservé.</small>
                      </div>
                      <form action={deleteForumSection}>
                        <input type="hidden" name="section_id" value={section.id} />
                        <ConfirmDeleteButton className={`button button--small ${destructiveStyles.dangerButton}`} label="Supprimer la catégorie" confirmMessage={`Supprimer définitivement la catégorie « ${section.title} » ?\n\nSes ${sectionBoards.length} forum${sectionBoards.length > 1 ? "s" : ""}, ${sectionStats.topics} sujet${sectionStats.topics > 1 ? "s" : ""} et ${sectionStats.posts} message${sectionStats.posts > 1 ? "s" : ""} seront supprimés de la base avec leurs données liées et médias. Les actes de chronique liés conserveront leur contenu mais perdront leur lien forum. Cette action est irréversible.`} />
                      </form>
                    </div>
                  </details>
                ) : (
                  <div className={styles.readOnlySummary}><span>Lecture seule</span><span>{sectionBoards.length} forum{sectionBoards.length > 1 ? "s" : ""}</span></div>
                )}

                <div className={styles.boardArea}>
                  <div className={styles.boardHeading}><div><p className="eyebrow">Forums</p><h3>{sectionBoards.length} espace{sectionBoards.length > 1 ? "s" : ""}</h3></div>{canEdit ? <span>Ouvrez un forum pour modifier ses permissions ou son emplacement.</span> : null}</div>

                  <div className={styles.boardList}>
                    {sectionBoards.map((board) => {
                      const stats = boardStats.get(board.id) ?? { topics: 0, posts: 0 };
                      return (
                        <article className={`${styles.boardCard}${board.is_active ? "" : ` ${styles.archived}`}`} key={board.id}>
                          <header>
                            <div>
                              <div className={styles.badges}><span>{policyLabel(board.topic_creation)} · sujets</span><span>{policyLabel(board.reply_policy)} · réponses</span>{!board.is_active ? <span>Archivé</span> : null}</div>
                              <h4>{board.title}</h4>
                              <p>{board.description || "Aucune description."}</p>
                              <div className={styles.boardFacts}><span>{stats.topics} sujet{stats.topics > 1 ? "s" : ""}</span><span>{stats.posts} message{stats.posts > 1 ? "s" : ""}</span><span>Position {board.sort_order}</span></div>
                            </div>
                            <div className={styles.headerTools}><Link className="text-link" href={`/forum/${board.slug}`}>Ouvrir ↗</Link><code>{board.slug}</code></div>
                          </header>

                          {canEdit ? (
                            <details className={styles.boardEditor}>
                              <summary>Modifier le forum</summary>
                              <form action={updateForumBoard} className={styles.formGrid}>
                                <input type="hidden" name="board_id" value={board.id} />
                                <label className={styles.wide}><span>Nom</span><input name="title" defaultValue={board.title} minLength={2} maxLength={100} required /></label>
                                <label className={styles.wide}><span>Description</span><textarea name="description" defaultValue={board.description} rows={3} maxLength={1200} /></label>
                                <label><span>Catégorie</span><select name="section_id" defaultValue={board.section_id}>{sections.map((option) => <option value={option.id} key={option.id}>{option.title}{option.is_active ? "" : " · archivée"}</option>)}</select></label>
                                <label><span>Badge</span><input name="badge" defaultValue={board.badge ?? ""} maxLength={60} placeholder="Optionnel" /></label>
                                <label><span>Créer un sujet</span><select name="topic_creation" defaultValue={board.topic_creation}><option value="members">Tous les membres</option><option value="staff">Équipe uniquement</option><option value="closed">Fermé</option></select></label>
                                <label><span>Répondre</span><select name="reply_policy" defaultValue={board.reply_policy}><option value="members">Tous les membres</option><option value="staff">Équipe uniquement</option><option value="closed">Fermé</option></select></label>
                                <label><span>Position</span><input name="sort_order" type="number" min={0} max={9999} defaultValue={board.sort_order} required /></label>
                                <label><span>État</span><select name="status" defaultValue={board.is_active ? "active" : "archived"}><option value="active">Actif</option><option value="archived">Archivé</option></select></label>
                                <div className={styles.formAction}><button className="button button--primary button--small" type="submit">Enregistrer le forum</button></div>
                              </form>
                              <div className={destructiveStyles.memberDanger}>
                                <div className={destructiveStyles.memberDangerText}>
                                  <strong>Supprimer définitivement ce forum</strong>
                                  <small>{stats.topics} sujet{stats.topics > 1 ? "s" : ""} et {stats.posts} message{stats.posts > 1 ? "s" : ""} seront supprimés avec leurs données et médias.</small>
                                </div>
                                <form action={deleteForumBoard}>
                                  <input type="hidden" name="board_id" value={board.id} />
                                  <ConfirmDeleteButton className={`button button--small ${destructiveStyles.dangerButton}`} label="Supprimer le forum" confirmMessage={`Supprimer définitivement le forum « ${board.title} » ?\n\n${stats.topics} sujet${stats.topics > 1 ? "s" : ""} et ${stats.posts} message${stats.posts > 1 ? "s" : ""} seront supprimés de la base avec leurs données liées et médias. Les actes de chronique éventuellement liés à ces sujets conserveront leur contenu mais perdront leur lien forum. Cette action est irréversible.`} />
                                </form>
                              </div>
                            </details>
                          ) : (
                            <div className={styles.readOnlySummary}><span>Position {board.sort_order}</span><Link className="text-link" href={`/forum/${board.slug}`}>Ouvrir le forum →</Link></div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  {canEdit ? (
                    <details className={styles.createBoard}>
                      <summary>+ Ajouter un forum à « {section.title} »</summary>
                      <form action={createForumBoard} className={styles.formGrid}>
                        <input type="hidden" name="section_id" value={section.id} />
                        <label className={styles.wide}><span>Nom</span><input name="title" minLength={2} maxLength={100} required placeholder="Nom du forum" /></label>
                        <label className={styles.wide}><span>Description</span><textarea name="description" rows={3} maxLength={1200} placeholder="Objectif et usage du forum" /></label>
                        <label><span>Badge</span><input name="badge" maxLength={60} placeholder="Optionnel" /></label>
                        <label><span>Créer un sujet</span><select name="topic_creation" defaultValue="members"><option value="members">Tous les membres</option><option value="staff">Équipe uniquement</option><option value="closed">Fermé</option></select></label>
                        <label><span>Répondre</span><select name="reply_policy" defaultValue="members"><option value="members">Tous les membres</option><option value="staff">Équipe uniquement</option><option value="closed">Fermé</option></select></label>
                        <div className={styles.formAction}><button className="button button--primary button--small" type="submit">Créer le forum</button></div>
                      </form>
                    </details>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {!sections.length && !loadError ? <div className={styles.empty}><strong>Aucune catégorie.</strong><p>Créez la première catégorie pour commencer à structurer le forum.</p></div> : null}
      </section>
    </main>
  );
}
