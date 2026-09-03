"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveCharacter } from "@/app/personnages/actions";

export type EditableCharacter = {
  id: string;
  slug: string;
  name: string;
  epithet: string;
  short_summary: string;
  world: string;
  people: string;
  age: string;
  origin: string;
  residence: string;
  occupation: string;
  affiliation: string;
  quote: string;
  traits: string[];
  biography: string;
  hooks: { title: string; text: string }[];
  visibility: "public" | "unlisted" | "private";
  status: string;
  portraitUrl?: string | null;
  is_moderation_hidden?: boolean;
  moderation_note?: string;
};

type EditorMode = "create" | "edit";
type EditableHook = { title: string; text: string };

const emptyHooks: EditableHook[] = [
  { title: "", text: "" },
  { title: "", text: "" },
  { title: "", text: "" },
];

function getInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

function SubmitButton({ intent, children, ghost = false }: { intent: "draft" | "publish" | "archive"; children: React.ReactNode; ghost?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={`button ${ghost ? "button--ghost" : "button--primary"}`} type="submit" name="intent" value={intent} disabled={pending}>
      {pending ? "Enregistrement…" : children}
    </button>
  );
}

export function CharacterEditor({
  mode,
  initialCharacter,
  notice,
}: {
  mode: EditorMode;
  initialCharacter?: EditableCharacter;
  notice?: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialCharacter?.name ?? "");
  const [epithet, setEpithet] = useState(initialCharacter?.epithet ?? "");
  const [summary, setSummary] = useState(initialCharacter?.short_summary ?? "");
  const [world, setWorld] = useState(initialCharacter?.world ?? "Moogle");
  const [people, setPeople] = useState(initialCharacter?.people ?? "");
  const [age, setAge] = useState(initialCharacter?.age ?? "");
  const [origin, setOrigin] = useState(initialCharacter?.origin ?? "");
  const [residence, setResidence] = useState(initialCharacter?.residence ?? "");
  const [occupation, setOccupation] = useState(initialCharacter?.occupation ?? "");
  const [affiliation, setAffiliation] = useState(initialCharacter?.affiliation ?? "");
  const [quote, setQuote] = useState(initialCharacter?.quote ?? "");
  const [traits, setTraits] = useState(initialCharacter?.traits.join(", ") ?? "");
  const [biography, setBiography] = useState(initialCharacter?.biography ?? "");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">(initialCharacter?.visibility ?? "public");
  const [hookList, setHookList] = useState<EditableHook[]>(() => {
    const existing = initialCharacter?.hooks ?? [];
    return [0, 1, 2].map((index) => existing[index] ?? emptyHooks[index]);
  });
  const [portraitName, setPortraitName] = useState("");
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [removePortrait, setRemovePortrait] = useState(false);

  useEffect(() => {
    if (!portraitPreviewUrl) return;
    return () => URL.revokeObjectURL(portraitPreviewUrl);
  }, [portraitPreviewUrl]);

  const parsedTraits = useMemo(() => traits.split(",").map((trait) => trait.trim()).filter(Boolean).slice(0, 8), [traits]);
  const initials = getInitials(displayName);
  const title = mode === "create" ? "Créer mon personnage" : `Modifier ${initialCharacter?.name ?? "mon personnage"}`;
  const portraitUrl = portraitPreviewUrl ?? (removePortrait ? null : initialCharacter?.portraitUrl ?? null);
  const publishVisibility = visibility === "public"
    ? "la fiche apparaîtra immédiatement dans le répertoire public."
    : visibility === "unlisted"
      ? "la fiche sera publiée mais accessible uniquement par son lien direct."
      : "la fiche sera enregistrée comme publiée mais restera visible uniquement par vous et l’équipe.";

  function updateHook(index: number, field: keyof EditableHook, value: string) {
    setHookList((current) => current.map((hook, hookIndex) => hookIndex === index ? { ...hook, [field]: value } : hook));
  }

  function handlePortraitChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPortraitName(file?.name ?? "");
    setPortraitPreviewUrl(file ? URL.createObjectURL(file) : null);
    if (file) setRemovePortrait(false);
  }

  return (
    <div className="character-editor-shell">
      <header className="character-editor-header">
        <div>
          <p className="eyebrow">Espace personnage · connecté</p>
          <h1>{title}</h1>
          <p>La fiche est enregistrée dans votre compte et peut être utilisée comme identité dans les espaces RP.</p>
        </div>
        <div className="character-editor-header__actions">
          <Link className="button button--ghost" href={initialCharacter ? `/personnages/${initialCharacter.slug}` : "/personnages"}>Annuler</Link>
        </div>
      </header>

      {initialCharacter?.is_moderation_hidden ? (
        <div className="character-editor-notice character-editor-notice--warning">
          <strong>Fiche masquée par l’équipe.</strong>
          <span>{initialCharacter.moderation_note || "Cette fiche reste visible pour vous mais n’est plus publiée auprès de la communauté."}</span>
        </div>
      ) : (
        <div className="character-editor-notice">
          <strong>Publication réelle.</strong>
          <span>Vous pouvez conserver un brouillon, publier la fiche ou la rendre privée/non répertoriée à tout moment.</span>
        </div>
      )}
      {notice ? <div className="character-editor-toast" role="alert">{notice}</div> : null}

      <form id="character-editor-form" className="character-editor-layout" action={saveCharacter} encType="multipart/form-data">
        <input type="hidden" name="character_id" value={initialCharacter?.id ?? ""} />
        <input type="hidden" name="current_slug" value={initialCharacter?.slug ?? ""} />

        <div className="character-editor-form">
          <EditorSection number="01" kicker="Identité" title="Présenter le personnage">
            <div className="character-editor-grid character-editor-grid--two">
              <Field label="Nom du personnage"><input name="name" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex. Aelys Vardane" /></Field>
              <Field label="Surnom / épithète"><input name="epithet" maxLength={120} value={epithet} onChange={(event) => setEpithet(event.target.value)} placeholder="Ex. Cartographe des chemins oubliés" /></Field>
              <Field label="Peuple"><input name="people" maxLength={80} value={people} onChange={(event) => setPeople(event.target.value)} placeholder="Hyur, Miqo'te…" /></Field>
              <Field label="Âge RP"><input name="age" maxLength={40} value={age} onChange={(event) => setAge(event.target.value)} placeholder="Ex. 28 ans" /></Field>
              <Field label="Monde"><input name="world" maxLength={80} value={world} onChange={(event) => setWorld(event.target.value)} placeholder="Moogle" /></Field>
              <Field label="Origine"><input name="origin" maxLength={120} value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Ul'dah" /></Field>
              <Field label="Résidence"><input name="residence" maxLength={120} value={residence} onChange={(event) => setResidence(event.target.value)} placeholder="Tuliyollal" /></Field>
              <Field label="Occupation"><input name="occupation" maxLength={120} value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="Cartographe, mercenaire…" /></Field>
              <Field label="Affiliation" className="character-editor-grid__wide"><input name="affiliation" maxLength={160} value={affiliation} onChange={(event) => setAffiliation(event.target.value)} placeholder="Libre, compagnie, organisation…" /></Field>
            </div>
          </EditorSection>

          <EditorSection number="02" kicker="Portrait & tonalité" title="Donner un visage à la fiche">
            <div className="character-editor-media-row">
              <div className="character-editor-upload-column">
                <label className="character-editor-upload">
                  <input name="portrait" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePortraitChange} />
                  <span className="character-editor-upload__mark">{initials}</span>
                  <strong>{portraitName || (initialCharacter?.portraitUrl && !removePortrait ? "Remplacer le portrait" : "Importer un portrait")}</strong>
                  <small>PNG, JPG ou WebP · 4 Mo maximum · aperçu avant enregistrement</small>
                </label>
                {initialCharacter?.portraitUrl ? (
                  <label className="character-editor-remove-portrait">
                    <input
                      name="remove_portrait"
                      type="checkbox"
                      checked={removePortrait}
                      onChange={(event) => {
                        setRemovePortrait(event.target.checked);
                        if (event.target.checked) {
                          setPortraitName("");
                          setPortraitPreviewUrl(null);
                        }
                      }}
                    />
                    <span>Retirer le portrait actuel lors de l’enregistrement</span>
                  </label>
                ) : null}
              </div>
              <div className="character-editor-media-copy">
                <Field label="Citation"><input name="quote" maxLength={300} value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Une phrase qui résume le personnage" /></Field>
                <Field label="Traits" help="Séparez les traits par des virgules, 8 maximum."><input name="traits" value={traits} onChange={(event) => setTraits(event.target.value)} placeholder="Curieuse, pragmatique, observatrice" /></Field>
              </div>
            </div>
          </EditorSection>

          <EditorSection number="03" kicker="Présentation" title="Résumé et histoire">
            <Field label="Résumé court"><textarea name="short_summary" rows={3} maxLength={600} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Quelques lignes visibles dans le répertoire…" /></Field>
            <Field label="Biographie" help="30 000 caractères maximum."><textarea name="biography" rows={10} maxLength={30000} value={biography} onChange={(event) => setBiography(event.target.value)} placeholder="Racontez le parcours du personnage…" /></Field>
          </EditorSection>

          <EditorSection number="04" kicker="Rencontres possibles" title="Accroches RP">
            <div className="character-editor-hooks">
              {hookList.map((hook, index) => (
                <div className="character-editor-hook" key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Field label="Titre"><input name={`hook_title_${index}`} maxLength={100} value={hook.title} onChange={(event) => updateHook(index, "title", event.target.value)} placeholder="Ex. Courrier en retard" /></Field>
                  <Field label="Accroche"><textarea name={`hook_text_${index}`} maxLength={800} rows={3} value={hook.text} onChange={(event) => updateHook(index, "text", event.target.value)} placeholder="Comment un autre personnage peut-il entrer en jeu ?" /></Field>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection number="05" kicker="Publication" title="Visibilité de la fiche">
            <div className="character-editor-visibility">
              {([
                ["public", "Publique", "Visible dans le répertoire et accessible par URL."],
                ["unlisted", "Non répertoriée", "Accessible par lien direct mais absente du répertoire."],
                ["private", "Privée", "Visible uniquement par son propriétaire et l’équipe."],
              ] as const).map(([value, label, description]) => (
                <label className={visibility === value ? "is-selected" : ""} key={value}>
                  <input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} />
                  <strong>{label}</strong>
                  <span>{description}</span>
                </label>
              ))}
            </div>
            <p className="character-editor-publish-note"><strong>Si vous publiez maintenant :</strong> {publishVisibility}</p>
            <div className="character-live-actions">
              <SubmitButton intent="draft" ghost>{initialCharacter?.status === "published" ? "Repasser en brouillon" : "Enregistrer le brouillon"}</SubmitButton>
              <SubmitButton intent="publish">{initialCharacter?.status === "published" ? "Enregistrer et publier" : "Publier la fiche"}</SubmitButton>
              {mode === "edit" && initialCharacter?.status !== "archived" ? <SubmitButton intent="archive" ghost>Archiver</SubmitButton> : null}
            </div>
          </EditorSection>
        </div>

        <aside className="character-editor-preview" aria-label="Aperçu de la fiche">
          <div className="character-editor-preview__sticky">
            <div className="character-editor-preview__label">Aperçu en direct</div>
            <div className="character-editor-preview__portrait">
              {portraitUrl ? <img className="character-live-portrait" src={portraitUrl} alt="Aperçu du portrait sélectionné" /> : <span>{initials}</span>}
              <small>{portraitName || (initialCharacter?.portraitUrl && !removePortrait ? "Portrait actuel" : "Aucun portrait")}</small>
            </div>
            <div className="character-editor-preview__identity">
              <small>{people || "Peuple"} · {world || "Monde"}</small>
              <h2>{displayName || "Nom du personnage"}</h2>
              <p className="character-editor-preview__epithet">{epithet || "Épithète ou fonction RP"}</p>
              <p>{summary || "Le résumé court apparaîtra ici dans les listes et sur la fiche publique."}</p>
            </div>
            {quote ? <blockquote>« {quote} »</blockquote> : null}
            <div className="character-editor-preview__traits">
              {parsedTraits.length ? parsedTraits.map((trait) => <span key={trait}>{trait}</span>) : <span>Traits RP</span>}
            </div>
            <dl className="character-editor-preview__facts">
              <div><dt>Origine</dt><dd>{origin || "—"}</dd></div>
              <div><dt>Résidence</dt><dd>{residence || "—"}</dd></div>
              <div><dt>Occupation</dt><dd>{occupation || "—"}</dd></div>
              <div><dt>Affiliation</dt><dd>{affiliation || "—"}</dd></div>
            </dl>
            <div className="character-editor-preview__visibility">Visibilité : <strong>{visibility === "public" ? "Publique" : visibility === "unlisted" ? "Non répertoriée" : "Privée"}</strong></div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function EditorSection({ number, kicker, title, children }: { number: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="character-editor-section">
      <div className="character-editor-section__heading"><span>{number}</span><div><small>{kicker}</small><h2>{title}</h2></div></div>
      {children}
    </section>
  );
}

function Field({ label, help, className, children }: { label: string; help?: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span>{label}</span>{children}{help ? <small>{help}</small> : null}</label>;
}
