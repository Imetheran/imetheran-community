import type { ReactNode } from "react";
import { ConfirmDeleteButton } from "../../confirm-delete-button";
import destructiveStyles from "../../destructive-actions.module.css";
import { createClient } from "@/lib/supabase/server";
import { deleteChronicle } from "../delete-action";

export const dynamic = "force-dynamic";

export default async function ChronicleDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: chronicle } = await supabase
    .from("chronicles")
    .select("title, publication_status")
    .eq("id", id)
    .maybeSingle();

  return (
    <>
      {children}
      {chronicle ? (
        <section className="content-frame admin-workspace" aria-labelledby="chronicle-danger-zone-title">
          <section className="admin-panel">
            <header className="admin-panel__head">
              <div>
                <p className="eyebrow">Zone dangereuse</p>
                <h2 id="chronicle-danger-zone-title">Supprimer cette chronique</h2>
              </div>
              <span className="admin-panel__status">Irréversible</span>
            </header>
            <div className={destructiveStyles.memberDanger}>
              <div className={destructiveStyles.memberDangerText}>
                <strong>Suppression définitive de « {chronicle.title} »</strong>
                <small>La chronique, tous ses actes, ses participants et sa couverture stockée seront supprimés de la base et du stockage. Les sujets du forum auxquels les actes étaient reliés restent intacts.</small>
              </div>
              <form action={deleteChronicle}>
                <input type="hidden" name="chronicle_id" value={id} />
                <ConfirmDeleteButton
                  className={`button button--small ${destructiveStyles.dangerButton}`}
                  label="Supprimer définitivement"
                  confirmMessage={`Supprimer définitivement « ${chronicle.title} » ?\n\nTous les actes, participants et la couverture de cette chronique seront supprimés. Les sujets du forum resteront intacts. Cette action est irréversible.`}
                />
              </form>
            </div>
          </section>
        </section>
      ) : null}
    </>
  );
}
