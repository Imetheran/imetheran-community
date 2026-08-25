"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CharacterProfile, CharacterVisibility } from "@/content/character-content";

type EditorMode = "create" | "edit";

type CharacterEditorProps = {
  mode: EditorMode;
  initialCharacter?: CharacterProfile;
};

type EditableHook = { title: string; text: string };

const emptyHooks: EditableHook[] = [
  { title: "", text: "" },
  { title: "", text: "" },
  { title: "", text: "" },
];

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

export function CharacterEditor({ mode, initialCharacter }: CharacterEditorProps) {
  const [displayName, setDisplayName] = useState(initialCharacter?.displayName ?? "");
  const [epithet, setEpithet] = useState(initialCharacter?.epithet ?? "");
  const [summary, setSummary] = useState(initialCharacter?.summary ?? "");
  const [world, setWorld] = useState(initialCharacter?.world ?? "Moogle");
  const [people, setPeople] = useState(initialCharacter?.people ?? "");
  const [age, setAge] = useState(initialCharacter?.age ?? "");
  const [origin, setOrigin] = useState(initialCharacter?.origin ?? "");
  const [residence, setResidence] = useState(initialCharacter?.residence ?? "");
  const [occupation, setOccupation] = useState(initialCharacter?.occupation ?? "");
  const [affiliation, setAffiliation] = useState(initialCharacter?.affiliation ?? "");
  const [quote, setQuote] = useState(initialCharacter?.quote ?? "");
  const [traits, setTraits] = useState(initialCharacter?.traits.join(", ") ?? "");
  const [biography, setBiography] = useState(initialCharacter?.biography.join("\n\n") ?? "");
  const [visibility, setVisibility] = useState<CharacterVisibility>(initialCharacter?.visibility ?? "public");
  const [hooks, setHooks] = useState<EditableHook>(undefined as never);
  const [hookList, setHookList] = useState<EditableHook[]>(initialCharacter?.hooks.length ? initialCharacter.hooks : emptyHooks);
  const [portraitName, setPortraitName] = useState<string>("");
  const [savedMessage, setSavedMessage] = useState<string>("");

  const parsedTraits = useMemo(
    () => traits.split(",").map((trait) => trait.trim()).filter(Boolean).slice(0, 6),
    [traits],
  );

  const initials = getInitials(displayName);
  const title = mode === "create" ? "Créer mon personnage" : `Modifier ${initialCharacter?.displayName ?? "mon personnage"}`;

  function updateHook(index: number, field: keyof EditableHook, value: string) {
    setHookList((current) => current.map((hook, hookIndex) => hookIndex === index ? { ...hook, [field]: value } : hook));
  }

  function simulateSave() {
    setSavedMessage("Maquette enregistrée localement dans l’interface uniquement. Aucune donnée n’est encore envoyée au serveur.");
    window.setTimeout(() => setSavedMessage(""), 4500);
  }

  void hooks;
  void setHooks;

  return (
    <div className="character-editor-shell">
      <header className="character-editor-header">
        <div>
          <p className="eyebrow">Espace personnage · prototype</p>
          <h1>{title}</h1>
          <p>Préparez la fiche telle qu’elle apparaîtra dans le répertoire communautaire et dans les futurs liens RP.</p>
        </div>
        <div className="character-editor-header__actions">
          <Link className="button button--ghost" href={initialCharacter ? `/personnages/${initialCharacter.slug}` : "/personnages"}>Annuler</Link>
          <button className="button button--primary" type="button" onClick={simulateSave}>Enregistrer le brouillon</button>
        </div>
      </header>

      <div className="character-editor-notice">
        <strong>Mode démonstration.</strong>
        <span>Les champs sont interactifs, mais aucune donnée n’est persistée tant que l’authentification et Supabase ne sont pas connectés.</span>
      </div>

      {savedMessage ? <div className="character-editor-toast" role="status">{savedMessage}</div> : null}

      <div className="character-editor-layout">
        <form className="character-editor-form" onSubmit={(event) => event.preventDefault()}>
          <section className="character-editor-section">
            <div className="character-editor-section__heading">
              <span>01</span>
              <div><small>Identité</small><h2>Présenter le personnage</h2></div>
            </div>
            <div className="character-editor-grid character-editor-grid--two">
              <label><span>Nom du personnage</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ex. Aelys Vardane" /></label>
              <label><span>Surnom / épithète</span><input value={epithet} onChange={(event) => setEpithet(event.target.value)} placeholder="Ex. Cartographe des chemins oubliés" /></label>
              <label><span>Peuple</span><input value={people} onChange={(event) => setPeople(event.target.value)} placeholder="Hyur, Miqo'te…" /></label>
              <label><span>Âge RP</span><input value={age} onChange={(event) => setAge(event.target.value)} placeholder="Ex. 28 ans" /></label>
              <label><span>Monde</span><input value={world} onChange={(event) => setWorld(event.target.value)} placeholder="Moogle" /></label>
              <label><span>Origine</span><input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Ul'dah" /></label>
              <label><span>Résidence</span><input value={residence} onChange={(event) => setResidence(event.target.value)} placeholder="Tuliyollal" /></label>
              <label><span>Occupation</span><input value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="Cartographe, mercenaire…" /></label>
              <label className="character-editor-grid__wide"><span>Affiliation</span><input value={affiliation} onChange={(event) => setAffiliation(event.target.value)} placeholder="Libre, compagnie, organisation…" /></label>
            </div>
          </section>

          <section className="character-editor-section">
            <div className="character-editor-section__heading">
              <span>02</span>
              <div><small>Portrait & tonalité</small><h2>Donner un visage à la fiche</h2></div>
            </div>
            <div className="character-editor-media-row">
              <label className="character-editor-upload">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setPortraitName(event.target.files?.[0]?.name ?? "")} />
                <span className="character-editor-upload__mark">{initials}</span>
                <strong>{portraitName || "Importer un portrait"}</strong>
                <small>PNG, JPG ou WebP · stockage prévu dans Supabase Storage</small>
              </label>
              <div className="character-editor-media-copy">
                <label><span>Citation</span><input value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Une phrase qui résume le personnage" /></label>
                <label><span>Traits</span><input value={traits} onChange={(event) => setTraits(event.target.value)} placeholder="Curieuse, pragmatique, observatrice" /><small>Séparez les traits par des virgules.</small></label>
              </div>
            </div>
          </section>

          <section className="character-editor-section">
            <div className="character-editor-section__heading">
              <span>03</span>
              <div><small>Présentation</small><h2>Résumé et histoire</h2></div>
            </div>
            <label><span>Résumé court</span><textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Quelques lignes visibles dans le répertoire…" /></label>
            <label><span>Biographie</span><textarea rows={10} value={biography} onChange={(event) => setBiography(event.target.value)} placeholder="Racontez le parcours du personnage…" /><small>Les sauts de ligne seront conservés dans la future fiche.</small></label>
          </section>

          <section className="character-editor-section">
            <div className="character-editor-section__heading">
              <span>04</span>
              <div><small>Rencontres possibles</small><h2>Accroches RP</h2></div>
            </div>
            <div className="character-editor-hooks">
              {hookList.map((hook, index) => (
                <div className="character-editor-hook" key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <label><span>Titre</span><input value={hook.title} onChange={(event) => updateHook(index, "title", event.target.value)} placeholder="Ex. Courrier en retard" /></label>
                  <label><span>Accroche</span><textarea rows={3} value={hook.text} onChange={(event) => updateHook(index, "text", event.target.value)} placeholder="Comment un autre personnage peut-il entrer en jeu ?" /></label>
                </div>
              ))}
            </div>
          </section>

          <section className="character-editor-section">
            <div className="character-editor-section__heading">
              <span>05</span>
              <div><small>Publication</small><h2>Visibilité de la fiche</h2></div>
            </div>
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
          </section>
        </form>

        <aside className="character-editor-preview" aria-label="Aperçu de la fiche">
          <div className="character-editor-preview__sticky">
            <div className="character-editor-preview__label">Aperçu en direct</div>
            <div className="character-editor-preview__portrait"><span>{initials}</span><small>{portraitName || "Portrait"}</small></div>
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
      </div>
    </div>
  );
}
