import type { SupabaseClient } from "@supabase/supabase-js";

const CHARACTER_PORTRAIT_BUCKET = "character-portraits";
const CHARACTER_PORTRAIT_URL_TTL = 60 * 60;

type PortraitCharacter = {
  id: string;
  portrait_path: string | null;
};

export async function signedCharacterPortraitUrl(
  supabase: SupabaseClient,
  path: string | null,
) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(CHARACTER_PORTRAIT_BUCKET)
    .createSignedUrl(path, CHARACTER_PORTRAIT_URL_TTL);

  return error ? null : data.signedUrl;
}

export async function signedCharacterPortraitMap(
  supabase: SupabaseClient,
  characters: PortraitCharacter[],
) {
  const entries = await Promise.all(
    characters.map(async (character) => [
      character.id,
      await signedCharacterPortraitUrl(supabase, character.portrait_path),
    ] as const),
  );

  return new Map(entries);
}
