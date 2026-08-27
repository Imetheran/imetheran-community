export type ViewName = "reports" | "topics" | "posts" | "history";

export type SectionRef = { title: string; mode: string; is_active: boolean };
export type BoardRow = { id: string; slug: string; title: string; is_active: boolean; forum_sections: SectionRef | SectionRef[] | null };
export type TopicRow = { id: string; board_id: string; author_id: string; slug: string; title: string; status: string; is_pinned: boolean; is_locked: boolean; post_count: number; last_activity_at: string };
export type PostRow = { id: string; topic_id: string; author_id: string; content: string; created_at: string; edited_at: string | null; is_hidden: boolean; hidden_at: string | null; hidden_by: string | null };
export type ReportRow = { id: string; reporter_id: string; topic_id: string; post_id: string | null; reason: string; details: string; status: string; handled_by: string | null; resolution_note: string; created_at: string; updated_at: string; resolved_at: string | null };
export type EventRow = { id: string; actor_user_id: string | null; target_type: string; topic_id: string | null; post_id: string | null; report_id: string | null; action: string; details: Record<string, unknown>; created_at: string };

export type ForumMaps = {
  boards: BoardRow[];
  boardMap: Map<string, BoardRow>;
  topicMap: Map<string, TopicRow>;
  postMap: Map<string, PostRow>;
  profileMap: Map<string, string>;
};
