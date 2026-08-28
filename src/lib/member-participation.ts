import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberParticipation = {
  canParticipate: boolean;
  status: "active" | "suspended";
  suspendedUntil: string | null;
  suspensionReason: string | null;
};

export async function getMemberParticipation(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<MemberParticipation> {
  if (!userId) {
    return {
      canParticipate: false,
      status: "active",
      suspendedUntil: null,
      suspensionReason: null,
    };
  }

  const { data, error } = await supabase
    .from("member_controls")
    .select("participation_status, suspended_until, suspension_reason")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      canParticipate: true,
      status: "active",
      suspendedUntil: null,
      suspensionReason: null,
    };
  }

  const suspendedUntil = data.suspended_until ? String(data.suspended_until) : null;
  const isSuspended = data.participation_status === "suspended" &&
    (!suspendedUntil || new Date(suspendedUntil).getTime() > Date.now());

  return {
    canParticipate: !isSuspended,
    status: isSuspended ? "suspended" : "active",
    suspendedUntil,
    suspensionReason: isSuspended ? String(data.suspension_reason ?? "") || null : null,
  };
}
