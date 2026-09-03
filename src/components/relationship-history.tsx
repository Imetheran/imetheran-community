"use client";

import { useMemo, useState } from "react";
import { reviseCharacterRelationship, withdrawCharacterRelationship } from "@/app/liens/actions";
import { relationshipKinds, type RelationshipKind } from "@/content/relationship-content";

type RelationshipHistoryRow = {
  id: string;
  sourceName: string;
  targetName: string;
  kind: RelationshipKind;
  label: string;
  description: string;
  intensity: number;
  visibility: string;
  status: string;
  sourceApproved: boolean;
  targetApproved: boolean;
  decisionNote: string;
  moderationHidden: boolean;
};

type Filter = "all" | "pending" | "approved" | "revision_requested" | "rejected";

const filterLabels: Record<Filter, string> = {
  all: "Toutes",
  pending: "En attente",
  approved: "Validées",
  revision_requested: "À réviser",
  rejected: "Refusées",
};

function statusLabel(status: string) {
  if (status === "approved") return "Validée";
  if (status === "rejected") return "Refusée";
  if (status === "revision_requested") return "Révision demandée";
  return "En attente";
}

function visibilityLabel(value: string) {
  if (value === "private") return "Privée";
  if (value === "unlisted") return "Non répertoriée";
  return "Publique";
}

export function RelationshipHistory({ rows }: { rows: RelationshipHistoryRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(() => {
    const next: Record<Filter, number> = { all: rows.length, pending: 0, approved: 0, revision_requested: 0, rejected: 0 };
    rows.forEach((row) => {
      if (row.status in next && row.status !== "all") next[row.status as Exclude<Filter, "all">] += 1;
    });
    return next;
  }, [rows]);
  const filteredRows = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <>
      <div className="relationship-history-filters" role="group" aria-label="Filtrer mes relations">
        {(Object.keys(filterLabels) as Filter[]).map((value) => (
          <button type="button" className={filter === value ? "is-active" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)} key={value}>
            {filterLabels[value]} <span>{counts[value]}</span>
          </button>
        ))}
      </div>

      {filteredRows.length ? (
        <div className="relationship-owned-list">
          {filteredRows.map((relationship) => (
            <article className="relationship-owned" key={relationship.id}>
              <div className="relationship-owned__main">
                <div className="relationship-owned__badges">
                  <span>{statusLabel(relationship.status)}</span>
                  <span>{relationshipKinds[relationship.kind].label}</span>
                  <span>{visibilityLabel(relationship.visibility)}</span>
                  {relationship.moderationHidden ? <span>Masquée par l’équipe</span> : null}
                </div>
                <h4>{relationship.label}</h4>
                <p>{relationship.sourceName} ↔ {relationship.targetName}</p>
                {relationship.description ? <p className="relationship-owned__description">{relationship.description}</p> : null}
                {relationship.decisionNote ? <blockquote>{relationship.decisionNote}</blockquote> : null}
              </div>
              <div className="relationship-owned__approval" aria-label="État des validations">
                <span className={relationship.sourceApproved ? "is-ok" : ""}>Source {relationship.sourceApproved ? "✓" : "…"}</span>
                <span className={relationship.targetApproved ? "is-ok" : ""}>Cible {relationship.targetApproved ? "✓" : "…"}</span>
              </div>
              <details className="relationship-owned__edit" open={relationship.status === "revision_requested"}>
                <summary>{relationship.status === "revision_requested" ? "Réviser cette relation" : "Proposer une modification"}</summary>
                <form className="relationship-form relationship-form--compact" action={reviseCharacterRelationship}>
                  <input type="hidden" name="relationship_id" value={relationship.id} />
                  <label><span>Type</span><select name="kind" defaultValue={relationship.kind}>{(Object.entries(relationshipKinds) as Array<[RelationshipKind, { label: string }]>).map(([kind, meta]) => <option value={kind} key={kind}>{meta.label}</option>)}</select></label>
                  <label><span>Intensité</span><select name="intensity" defaultValue={String(relationship.intensity)}><option value="1">●○○ · légère</option><option value="2">●●○ · marquée</option><option value="3">●●● · forte</option></select></label>
                  <label className="relationship-form__wide"><span>Intitulé</span><input name="label" maxLength={120} required defaultValue={relationship.label} /></label>
                  <label className="relationship-form__wide"><span>Description</span><textarea name="description" maxLength={3000} rows={4} defaultValue={relationship.description} /></label>
                  <label className="relationship-form__wide"><span>Visibilité</span><select name="visibility" defaultValue={relationship.visibility}><option value="public">Publique</option><option value="unlisted">Non répertoriée</option><option value="private">Privée</option></select></label>
                  <button className="button button--primary button--small" type="submit">Soumettre la modification</button>
                </form>
              </details>
              <form className="relationship-owned__withdraw" action={withdrawCharacterRelationship}>
                <input type="hidden" name="relationship_id" value={relationship.id} />
                <button className="button button--ghost button--small" type="submit">Retirer ce lien</button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="relationship-empty relationship-empty--compact">
          <strong>Aucune relation dans cette catégorie.</strong>
          <p>Changez de filtre pour retrouver les autres liens de vos personnages.</p>
        </div>
      )}
    </>
  );
}
