"use client";

import { useEffect } from "react";
import { markTopicRead } from "@/app/forum/actions";

export function ForumReadMarker({ topicId, lastPostId }: { topicId: string; lastPostId: string | null }) {
  useEffect(() => {
    void markTopicRead(topicId, lastPostId);
  }, [topicId, lastPostId]);

  return null;
}
