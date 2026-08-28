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

function PublishButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary" type="submit" disabled={pending || disabled}>
      {pending ? "Publication…" : "Publier le sujet"}
    </button>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("fr") ?? "")
    .join("") || "M";
}

function topicTypeLabel(value: string, isRoleplay: boolean) {
  if (isRoleplay) {
    return value === "targeted"
      ? "Scène ciblée"
      : value === "storyline"
        ? "Scénario"
        : value === "event"
          ? "Événement"
          : "Scène ouverte";
  }

  return value === "question"
    ? "Question"
    : value === "share"
      ? "Partage"
      : "Discussion";
}

export function ForumTopicEditor({
  boardSlug,
  boardTitle,
  memberName,
  isRoleplay,
  characters,
  errorMessage,
}: {
  boardSlug: string;
  boardTitle: string;
  memberName: string;
  isRoleplay: boolean;
  characters: CharacterOption[];
  errorMessage?: string | null;
}) {
  const previewRef = useRef<HTMLElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [sceneType, setSceneType] = useState(isRoleplay ? "open" : "discussion");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [mediaMap, setMediaMap] = useState<ForumMediaRenderMap>({});

  const tagList = useMemo(() => tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5), [tags]);
  const selectedCharacter = characters.find((character) => character.id === characterId);
  const canPublish = title.trim().length > 0 && content.trim().length >= 2;

  const openPreview = () => {
    setPreviewOpen(true);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previewRef.current?.focus({ preventScroll: true });
    });
  };

  const closePreview = () => {
    setPreviewOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("forum-topic-editor-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="forum-topic-editor">
      <form className="forum-topic-editor__form" action={createForumTopic}>
        <input type="hidden" name="board_slug" value={boardSlug} />

        <div id="forum-topic-editor-compose" hidden={previewOpen}>
          <section className="forum-editor-panel">
            <div className="forum-editor-panel__heading">
              <div><span>01</span><div><small>Destination</small><h2>{boardTitle}</h2></div></div>
              <span className="status-pill">Forum</span>
            </div>
            <p>Choisissez votre identité, préparez la discussion puis prévisualisez le rendu exact avant publication.</p>
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

          <div className="forum-topic-editor__actions">
            <button className="button button--ghost" type="button" onClick={openPreview}>Prévisualiser le sujet</button>
            <button className="button button--ghost" type="button" disabled title="Les brouillons seront ajoutés ultérieurement.">Brouillons bientôt</button>
            <PublishButton />
          </div>
        </div>

        {errorMessage ? <div className="forum-editor-notice forum-editor-notice--error" role="alert">{errorMessage}</div> : null}

        {previewOpen ? (
          <section
            ref={previewRef}
            className="forum-topic-publish-preview"
            aria-labelledby="forum-topic-preview-title"
            tabIndex={-1}
          >
            <header className="forum-topic-publish-preview__intro">
              <div>
                <p className="eyebrow">Avant publication</p>
                <h2 id="forum-topic-preview-title">Prévisualisation du sujet</h2>
                <p>Voici le rendu du sujet et de son premier message tels qu’ils apparaîtront sur le forum.</p>
              </div>
              <span className="status-pill">Non publié</span>
            </header>

            <div className="forum-topic-publish-preview__thread-head">
              <div className="forum-thread-head__badges">
                <span>{topicTypeLabel(sceneType, isRoleplay)}</span>
                {location ? <span>{location}</span> : null}
                {tagList.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <h1>{title.trim() || "Titre de votre sujet"}</h1>
              <p>Aperçu avant publication · 1 message · 0 vue</p>
            </div>

            <div className="forum-posts forum-topic-publish-preview__posts">
              <article className="forum-post forum-post--topic-author">
                <aside className="forum-post__author">
                  <div className="forum-post__avatar" aria-hidden="true">{initials(memberName)}</div>
                  <strong>{memberName}</strong>
                  <span className="forum-post__role">Membre</span>
                  <span className="forum-post__starter">Auteur du sujet</span>
                  {selectedCharacter ? (
                    <div className="forum-post__character">
                      <small>Écrit avec</small>
                      <span>{selectedCharacter.name}</span>
                    </div>
                  ) : null}
                </aside>

                <div className="forum-post__body">
                  <header>
                    <div>
                      <span className="forum-post__number">#1</span>
                      <time>À l’instant</time>
                      <small>Aperçu avant publication</small>
                    </div>
                  </header>
                  <div className="forum-post__content">
                    <BbcodeContent
                      content={content.trim() || "Votre premier message apparaîtra ici."}
                      mediaMap={mediaMap}
                    />
                  </div>
                </div>
              </article>
            </div>

            {!canPublish ? (
              <div className="forum-editor-notice forum-editor-notice--error" role="status">
                Ajoutez un titre et au moins deux caractères dans le premier message avant de publier.
              </div>
            ) : null}

            <div className="forum-topic-publish-preview__actions">
              <button className="button button--ghost" type="button" onClick={closePreview}>← Revenir à l’édition</button>
              <PublishButton disabled={!canPublish} />
            </div>
          </section>
        ) : null}
      </form>
    </div>
  );
}
