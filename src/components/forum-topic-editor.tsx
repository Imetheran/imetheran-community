"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createForumTopic } from "@/app/forum/actions";
import { BbcodeContent } from "@/components/bbcode-content";
import { BbcodeEditor } from "@/components/bbcode-editor";
import type { ForumMediaRenderMap } from "@/lib/forum-media";

type CharacterOption = {
  id: string;
  name: string;
};

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary" type="submit" disabled={pending}>
      {pending ? "Publication…" : "Publier le sujet"}
    </button>
  );
}

export function ForumTopicEditor({
  boardSlug,
  boardTitle,
  isRoleplay,
  characters,
  errorMessage,
}: {
  boardSlug: string;
  boardTitle: string;
  isRoleplay: boolean;
  characters: CharacterOption[];
  errorMessage?: string | null;
}) {
  const previewRef = useRef<HTMLElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [sceneType, setSceneType] = useState(isRoleplay ? "open" : "discussion");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [mediaMap, setMediaMap] = useState<ForumMediaRenderMap>({});

  const tagList = useMemo(() => tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5), [tags]);
  const selectedCharacter = characters.find((character) => character.id === characterId);
  const identity = selectedCharacter?.name ?? "Compte membre";

  const showTopicPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => previewRef.current?.focus({ preventScroll: true }));
  };

  return (
    <div className="forum-topic-editor">
      <form className="forum-topic-editor__form" action={createForumTopic}>
        <input type="hidden" name="board_slug" value={boardSlug} />

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading">
            <div><span>01</span><div><small>Destination</small><h2>{boardTitle}</h2></div></div>
            <span className="status-pill">Forum</span>
          </div>
          <p>Choisissez votre identité, préparez la discussion puis utilisez l’aperçu pour vérifier votre mise en page avant publication.</p>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>02</span><div><small>Identité</small><h2>Qui publie ?</h2></div></div></div>
          <div className="forum-editor-grid forum-editor-grid--two">
            <label>
              <span>Publier en tant que</span>
              <select name="character_id" value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
                <option value="">Compte membre</option>
                {isRoleplay ? characters.map((character) => (
                  <option key={character.id} value={character.id}>{character.name}</option>
                )) : null}
              </select>
              <small>
                {isRoleplay
                  ? characters.length > 0
                    ? "Le compte reste l’auteur ; le personnage choisi devient l’identité RP affichée."
                    : "Aucun personnage ne vous est encore rattaché : vous pouvez publier avec votre compte membre."
                  : "Les zones hors-RP utilisent normalement l’identité du membre."}
              </small>
            </label>
            <label>
              <span>{isRoleplay ? "Type de scène" : "Type de sujet"}</span>
              <select name="topic_type" value={sceneType} onChange={(event) => setSceneType(event.target.value)}>
                {isRoleplay ? <>
                  <option value="open">Ouvert</option>
                  <option value="targeted">Ciblé</option>
                  <option value="storyline">Scénario</option>
                  <option value="event">Événement</option>
                </> : <>
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  <option value="share">Partage</option>
                </>}
              </select>
            </label>
          </div>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>03</span><div><small>Sujet</small><h2>Présenter la discussion</h2></div></div></div>
          <label>
            <span>Titre</span>
            <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isRoleplay ? "Ex. [Gridania] Une pluie inattendue" : "Titre du sujet"} maxLength={120} required />
            <small>{title.length}/120</small>
          </label>
          <div className="forum-editor-grid forum-editor-grid--two">
            {isRoleplay ? <label>
              <span>Lieu RP</span>
              <input name="rp_location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Gridania, Ul’dah, Kugane…" maxLength={120} />
            </label> : <input type="hidden" name="rp_location" value="" />}
            <label>
              <span>Tags</span>
              <input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Séparés par des virgules" />
              <small>Jusqu’à 5 tags.</small>
            </label>
          </div>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>04</span><div><small>Premier message</small><h2>Écrire et mettre en forme</h2></div></div></div>
          <BbcodeEditor
            name="content"
            value={content}
            onChange={setContent}
            rows={14}
            maxLength={50000}
            required
            previewMode="none"
            onMediaMapChange={setMediaMap}
            placeholder={isRoleplay ? "Décrivez l’ouverture de la scène…" : "Écrivez votre message…"}
          />
          <small className="forum-editor-help">Le BBCode permet aussi d’envoyer des images privées qui seront rattachées au message lors de la publication.</small>
        </section>

        {errorMessage ? <div className="forum-editor-notice forum-editor-notice--error" role="alert">{errorMessage}</div> : null}

        <div className="forum-topic-editor__actions">
          <button className="button button--ghost" type="button" onClick={showTopicPreview}>Prévisualiser le sujet</button>
          <button className="button button--ghost" type="button" disabled title="Les brouillons seront ajoutés ultérieurement.">Brouillons bientôt</button>
          <PublishButton />
        </div>
      </form>

      <aside
        ref={previewRef}
        id="forum-topic-preview"
        className="forum-topic-preview"
        aria-label="Aperçu du sujet"
        tabIndex={-1}
      >
        <div className="forum-topic-preview__sticky">
          <p className="eyebrow">Aperçu en direct</p>
          <div className="forum-topic-preview__card">
            <div className="forum-topic-preview__meta">
              <span>{sceneType}</span>
              {location ? <span>{location}</span> : null}
            </div>
            <h2>{title || "Titre de votre sujet"}</h2>
            <div className="forum-topic-preview__identity"><span>{identity.slice(0, 2).toLocaleUpperCase("fr")}</span><div><small>Publié par</small><strong>{identity}</strong></div></div>
            <div className="forum-topic-preview__tags">{tagList.length ? tagList.map((tag) => <span key={tag}>{tag}</span>) : <span>Aucun tag</span>}</div>
            <BbcodeContent content={content || "Le début de votre message apparaîtra ici pendant la rédaction."} mediaMap={mediaMap} />
          </div>
          <p className="forum-topic-preview__note">L’aperçu applique les mêmes règles BBCode et images que le message publié.</p>
        </div>
      </aside>
    </div>
  );
}
