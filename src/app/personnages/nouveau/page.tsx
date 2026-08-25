import { CharacterEditor } from "@/components/character-editor";
import { SiteHeader } from "@/components/site-header";

export default function NewCharacterPage() {
  return (
    <main className="site-shell character-editor-page">
      <SiteHeader />
      <section className="content-frame character-editor-page__content">
        <CharacterEditor mode="create" />
      </section>
    </main>
  );
}
