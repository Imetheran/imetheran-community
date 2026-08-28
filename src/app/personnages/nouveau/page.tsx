import { redirect } from "next/navigation";
import { CharacterEditor } from "@/components/character-editor";
import { SiteHeader } from "@/components/site-header";
import { getMemberParticipation } from "@/lib/member-participation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function errorMessage(code?: string) {
  if (code === "champs") return "Vérifiez les champs de la fiche avant de l’enregistrer.";
  if (code === "portrait") return "Le portrait doit être un JPG, PNG ou WebP de 4 Mo maximum.";
  if (code === "enregistrement") return "La fiche n’a pas pu être enregistrée. Vérifiez vos droits ou réessayez.";
  return null;
}

export default async function NewCharacterPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") {
    redirect("/connexion?message=connexion-requise&retour=%2Fpersonnages%2Fnouveau");
  }

  const participation = await getMemberParticipation(supabase, userId);
  if (!participation.canParticipate) {
    redirect("/compte?message=participation-suspendue");
  }

  return (
    <main className="site-shell character-editor-page">
      <SiteHeader />
      <section className="content-frame character-editor-page__content">
        <CharacterEditor mode="create" notice={errorMessage(query.erreur)} />
      </section>
    </main>
  );
}
