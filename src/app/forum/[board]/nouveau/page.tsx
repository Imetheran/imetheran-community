import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ForumTopicEditor } from "@/components/forum-topic-editor";
import { canUseForumWritePolicy } from "@/lib/forum-access";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  champs: "Le titre et le premier message sont requis. Vérifiez également leur longueur.",
  suspendu: "Votre participation est actuellement suspendue. Vous pouvez lire le forum, mais pas publier.",
  fermee: "La création de sujets est actuellement fermée dans ce forum.",
  reservee: "La création de sujets est réservée à l’équipe dans ce forum.",
  publication: "Le sujet n’a pas pu être publié. Vérifiez vos droits dans ce forum ou réessayez dans un instant.",
};

export default async function NewForumTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ board: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const [{ board: boardSlug }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;

  if (claimsError || !claims || typeof userId !== "string") {
    redirect(`/connexion?message=connexion-requise&retour=${encodeURIComponent(`/forum/${boardSlug}/nouveau`)}`);
  }

  const { data: boardRow, error: boardError } = await supabase
    .from("forum_boards")
    .select(`
      id,
      slug,
      title,
      description,
      topic_creation,
      is_active,
      forum_sections!inner (
        id,
        title,
        mode,
        access_scope,
        is_active
      )
    `)
    .eq("slug", boardSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (boardError || !boardRow) notFound();

  const section = Array.isArray(boardRow.forum_sections)
    ? boardRow.forum_sections[0]
    : boardRow.forum_sections;
  if (!section || !section.is_active) notFound();

  const appMetadata = claims.app_metadata;
  const role = appMetadata && typeof appMetadata === "object" && "role" in appMetadata
    ? String(appMetadata.role)
    : "member";
  const participation = await getMemberParticipation(supabase, userId);

  if (!participation.canParticipate) {
    redirect("/compte?message=participation-suspendue");
  }

  if (!canUseForumWritePolicy(boardRow.topic_creation, userId, role, participation.canParticipate)) {
    redirect(`/forum/${boardRow.slug}`);
  }

  const characters = section.mode === "rp"
    ? (await supabase
        .from("characters")
        .select("id, name")
        .eq("owner_id", userId)
        .order("name"))
    : { data: [] as { id: string; name: string }[] };

  const errorMessage = query.erreur
    ? errorMessages[query.erreur] ?? "Une erreur est survenue pendant la préparation du sujet."
    : null;

  return (
    <main className="site-shell forum-new-topic-page">
      <SiteHeader />

      <section className="forum-compose-head">
        <div className="content-frame">
          <nav className="forum-breadcrumbs" aria-label="Fil d’Ariane">
            <Link href="/forum">Forum</Link><span>›</span>
            <span>{section.title}</span><span>›</span>
            <Link href={`/forum/${boardRow.slug}`}>{boardRow.title}</Link><span>›</span><strong>Nouveau sujet</strong>
          </nav>
          <p className="eyebrow">Espace membre</p>
          <h1>Nouveau sujet</h1>
          <p>Préparez votre sujet et son premier message avant de les publier ensemble sur le forum.</p>
        </div>
      </section>

      <section className="content-frame forum-compose-workspace">
        <div className="forum-access-note">
          <span aria-hidden="true">✦</span>
          <p><strong>Identité de publication.</strong> Votre compte reste associé au sujet. Dans un espace RP, vous pouvez également écrire sous l’identité de l’un de vos personnages.</p>
        </div>
        <ForumTopicEditor
          boardSlug={boardRow.slug}
          boardTitle={boardRow.title}
          isRoleplay={section.mode === "rp"}
          characters={characters.data ?? []}
          errorMessage={errorMessage}
        />
      </section>
    </main>
  );
}
