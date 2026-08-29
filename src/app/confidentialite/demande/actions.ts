"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["access", "rectification", "deletion", "objection", "restriction", "portability", "other"]);

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitPrivacyRequest(formData: FormData) {
  const honeypot = field(formData, "website");
  if (honeypot) redirect("/confidentialite/demande?message=envoyee");

  const email = field(formData, "email").toLowerCase();
  const requestType = field(formData, "request_type");
  const message = field(formData, "message");

  if (!email || email.length > 254 || !email.includes("@")) redirect("/confidentialite/demande?erreur=email");
  if (!allowedTypes.has(requestType)) redirect("/confidentialite/demande?erreur=type");
  if (message.length < 10 || message.length > 4000) redirect("/confidentialite/demande?erreur=message");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_privacy_request", {
    p_email: email,
    p_request_type: requestType,
    p_message: message,
  });

  if (error) {
    const normalized = `${error.message} ${error.code}`.toLowerCase();
    if (normalized.includes("rate") || normalized.includes("privacy_request_rate_limited")) {
      redirect("/confidentialite/demande?erreur=limite");
    }
    redirect("/confidentialite/demande?erreur=envoi");
  }

  redirect("/confidentialite/demande?message=envoyee");
}
