import { notFound } from "next/navigation";
import { CharacterEditor } from "@/components/character-editor";
import { SiteHeader } from "@/components/site-header";
import { characters, getCharacterBySlug } from "@/content/character-content";

export function generateStaticParams() {
  return characters.map((character) => ({ slug: character.slug }));
}

export default async function EditCharacterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);

  if (!character) notFound();

  return (
    <main className="site-shell character-editor-page">
      <SiteHeader />
      <section className="content-frame character-editor-page__content">
        <CharacterEditor mode="edit" initialCharacter={character} />
      </section>
    </main>
  );
}
