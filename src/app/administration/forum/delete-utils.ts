import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ForumMediaManifest = {
  ids: string[];
  paths: string[];
};

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

export async function topicIdsForBoardIds(supabase: SupabaseClient, boardIds: string[]) {
  const topicIds: string[] = [];
  for (const batch of chunks(boardIds, 150)) {
    if (!batch.length) continue;
    const { data, error } = await supabase.from("forum_topics").select("id").in("board_id", batch);
    if (error) return { topicIds: [], error };
    for (const row of data ?? []) topicIds.push(row.id);
  }
  return { topicIds, error: null };
}

export async function postIdsForTopicIds(supabase: SupabaseClient, topicIds: string[]) {
  const postIds: string[] = [];
  for (const batch of chunks(topicIds, 150)) {
    if (!batch.length) continue;
    const { data, error } = await supabase.from("forum_posts").select("id").in("topic_id", batch);
    if (error) return { postIds: [], error };
    for (const row of data ?? []) postIds.push(row.id);
  }
  return { postIds, error: null };
}

export async function collectForumMediaForPostIds(supabase: SupabaseClient, postIds: string[]) {
  const ids: string[] = [];
  const paths: string[] = [];

  for (const batch of chunks(postIds, 150)) {
    if (!batch.length) continue;
    const { data, error } = await supabase.from("forum_media").select("id, storage_path").in("post_id", batch);
    if (error) return { manifest: { ids: [], paths: [] } as ForumMediaManifest, error };
    for (const row of data ?? []) {
      ids.push(row.id);
      if (row.storage_path) paths.push(row.storage_path);
    }
  }

  return { manifest: { ids, paths } as ForumMediaManifest, error: null };
}

export async function cleanupForumMedia(supabase: SupabaseClient, manifest: ForumMediaManifest) {
  let failed = false;

  for (const batch of chunks(manifest.paths, 100)) {
    if (!batch.length) continue;
    const { error } = await supabase.storage.from("forum-media").remove(batch);
    if (error) failed = true;
  }

  for (const batch of chunks(manifest.ids, 150)) {
    if (!batch.length) continue;
    const { error } = await supabase.from("forum_media").delete().in("id", batch);
    if (error) failed = true;
  }

  return { failed };
}
