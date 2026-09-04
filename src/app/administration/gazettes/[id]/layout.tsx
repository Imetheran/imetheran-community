import type { ReactNode } from "react";
import { ConfirmDeleteButton } from "../../confirm-delete-button";
import destructiveStyles from "../../destructive-actions.module.css";
import { createClient } from "@/lib/supabase/server";
import { deleteGazette } from "../delete-action";

export const dynamic = "force-dynamic";

export default async function GazetteDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: gazette } = await supabase
    .from("gazettes")
    .select("title, headline, issue_number")
    .eq("id", id)
    .maybeSingle();

  const label = gazette?.headline || gazette?.title || "cette Gazette";

  return (
    <>
      {children}
      {gazette ? (
        <section className="content-frame admin-workspace" aria-labelledby="gazette-danger-zone-title">
          <section className="admin-panel">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Zone dangereuse</p>
                <h2 id="gazette-danger-zone-title">Supprimer ce numéro</h2>
              </div>
              <span className="admin-panel__status">Irréversible</span>
            </header>
            <div className={destructiveStyles.memberDanger}>
              <div className={destructiveStyles.memberDangerText}>
                <strong>Suppression définitive du N° {String(gazette.issue_number).padStart(2, "0")} · {label}</strong>
                <small>Le numéro, tous ses articles et sa couverture stockée seront supprimés de la base et du stockage. Cette action ne peut pas être annulée.</small>
              </div>
              <form action={deleteGazette}>
                <input type="hidden" name="gazette_id" value={id} />
                <ConfirmDeleteButton
                  className={`button button--small ${destructiveStyles.dangerButton}`}
                  label="Supprimer définitivement"
                  confirmMessage={`Supprimer définitivement la Gazette N° ${String(gazette.issue_number).padStart(2, "0")} · « ${label} » ?\n\nTous ses articles et sa couverture seront supprimés. Cette action est irréversible.`}
                />
              </form>
            </div>
          </section>
        </section>
      ) : null}
    </>
  );
}
