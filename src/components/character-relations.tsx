import Link from "next/link";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";
import { createClient } from "@/lib/supabase/server";

export async function CharacterRelations({ characterId }: { characterId: string }) {
  const supabase = await createClient();
  const { data: relationships } = await supabase
    .from("character_relationships")
    .select("id, source_character_id, target_character_id, kind, label, description, intensity")
    .or(`source_character_id.eq.${characterId},target_character_id.eq.${characterId}`)
    .eq("status", "approved")
    .eq("source_approved", true)
    .eq("target_approved", true)
    .eq("visibility", "public")
    .eq("is_moderation_hidden", false)
    .order("updated_at", { ascending: false });

  const rows = relationships ?? [];
  const counterpartIds = Array.from(new Set(rows.map((relationship) =>
    relationship.source_character_id === characterId
      ? relationship.target_character_id
      : relationship.source_character_id,
  )));
  const { data: counterparts } = counterpartIds.length
    ? await supabase.from("characters").select("id, slug, name, epithet").in("id", counterpartIds)
    : { data: [] as { id: string; slug: string; name: string; epithet: string }[] };
  const counterpartMap = new Map((counterparts ?? []).map((character) => [character.id, character]));

  if (!rows.length) {
    return <p className="character-profile-section__empty">Aucune relation publique validée pour le moment.</p>;
  }

  return (
    <div className="character-relations">
      {rows.map((relationship) => {
        const counterpartId = relationship.source_character_id === characterId ? relationship.target_character_id : relationship.source_character_id;
        const counterpart = counterpartMap.get(counterpartId);
        if (!counterpart) return null;
        const kind = relationship.kind as RelationshipKind;
        const intensity = Math.min(3, Math.max(1, Number(relationship.intensity) || 1));
        return (
          <Link className={`character-relation character-relation--${kind} character-relation-live`} href={`/personnages/${counterpart.slug}`} key={relationship.id}>
            <div className="character-relation__avatar" aria-hidden="true">{String(counterpart.name).split(/\s+/).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join("")}</div>
            <div><small>{relationshipKinds[kind]?.label ?? kind} · {"●".repeat(intensity)}{"○".repeat(3 - intensity)}</small><h3>{counterpart.name}</h3><p>{relationship.label}</p>{relationship.description ? <span>{relationship.description}</span> : null}</div>
          </Link>
        );
      })}
    </div>
  );
}
