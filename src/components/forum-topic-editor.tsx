"use client";

import { useMemo, useState } from "react";

export function ForumTopicEditor({ boardTitle, isRoleplay }: { boardTitle: string; isRoleplay: boolean }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [identity, setIdentity] = useState(isRoleplay ? "Aelys Vardane" : "Compte membre");
  const [sceneType, setSceneType] = useState(isRoleplay ? "Ouvert" : "Discussion");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [notice, setNotice] = useState("");

  const tagList = useMemo(() => tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5), [tags]);

  function simulateSave(action: "draft" | "publish") {
    setNotice(action === "draft"
      ? "Brouillon simulé : aucune donnée n’est encore enregistrée."
      : "Publication simulée : le sujet sera réellement créé lorsque Supabase et l’authentification seront connectés.");
  }

  return (
    <div className="forum-topic-editor">
      <form className="forum-topic-editor__form" onSubmit={(event) => event.preventDefault()}>
        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading">
            <div><span>01</span><div><small>Destination</small><h2>{boardTitle}</h2></div></div>
            <span className="status-pill status-pill--quiet">Prototype</span>
          </div>
          <p>Le forum de destination est fixé depuis l’index. Dans l’administration, les permissions de création seront contrôlées par catégorie et rôle membre.</p>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>02</span><div><small>Identité</small><h2>Qui publie ?</h2></div></div></div>
          <div className="forum-editor-grid forum-editor-grid--two">
            <label>
              <span>Publier en tant que</span>
              <select value={identity} onChange={(event) => setIdentity(event.target.value)}>
                <option>Compte membre</option>
                {isRoleplay ? <>
                  <option>Aelys Vardane</option>
                  <option>Rhydan Sorel</option>
                  <option>Nahla Rahn</option>
                </> : null}
              </select>
              <small>{isRoleplay ? "Le compte reste l’auteur technique ; le personnage est l’identité RP affichée." : "Les zones hors-RP utilisent normalement l’identité du membre."}</small>
            </label>
            <label>
              <span>{isRoleplay ? "Type de scène" : "Type de sujet"}</span>
              <select value={sceneType} onChange={(event) => setSceneType(event.target.value)}>
                {isRoleplay ? <>
                  <option>Ouvert</option>
                  <option>Ciblé</option>
                  <option>Scénario</option>
                  <option>Événement</option>
                </> : <>
                  <option>Discussion</option>
                  <option>Question</option>
                  <option>Partage</option>
                </>}
              </select>
            </label>
          </div>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>03</span><div><small>Sujet</small><h2>Présenter la discussion</h2></div></div></div>
          <label>
            <span>Titre</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isRoleplay ? "Ex. [Gridania] Une pluie inattendue" : "Titre du sujet"} maxLength={120} />
            <small>{title.length}/120</small>
          </label>
          <div className="forum-editor-grid forum-editor-grid--two">
            {isRoleplay ? <label>
              <span>Lieu RP</span>
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Gridania, Ul’dah, Kugane…" />
            </label> : null}
            <label>
              <span>Tags</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Séparés par des virgules" />
              <small>Jusqu’à 5 tags.</small>
            </label>
          </div>
        </section>

        <section className="forum-editor-panel">
          <div className="forum-editor-panel__heading"><div><span>04</span><div><small>Premier message</small><h2>Écrire</h2></div></div></div>
          <div className="forum-editor-toolbar" aria-hidden="true"><span>B</span><span>I</span><span>H</span><span>“ ”</span><span>• Liste</span><span>🔗</span></div>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={14} placeholder={isRoleplay ? "Décrivez l’ouverture de la scène…" : "Écrivez votre message…"} />
          <small className="forum-editor-help">La barre d’édition est visuelle pour l’instant. On choisira plus tard entre Markdown et éditeur riche.</small>
        </section>

        {notice ? <div className="forum-editor-notice" role="status">{notice}</div> : null}

        <div className="forum-topic-editor__actions">
          <button className="button button--ghost" type="button" onClick={() => simulateSave("draft")}>Enregistrer le brouillon</button>
          <button className="button button--primary" type="button" onClick={() => simulateSave("publish")}>Publier le sujet</button>
        </div>
      </form>

      <aside className="forum-topic-preview" aria-label="Aperçu du sujet">
        <div className="forum-topic-preview__sticky">
          <p className="eyebrow">Aperçu en direct</p>
          <div className="forum-topic-preview__card">
            <div className="forum-topic-preview__meta">
              <span>{sceneType}</span>
              {location ? <span>{location}</span> : null}
            </div>
            <h2>{title || "Titre de votre sujet"}</h2>
            <div className="forum-topic-preview__identity"><span>{identity.slice(0, 2).toUpperCase()}</span><div><small>Publié par</small><strong>{identity}</strong></div></div>
            <div className="forum-topic-preview__tags">{tagList.length ? tagList.map((tag) => <span key={tag}>{tag}</span>) : <span>Aucun tag</span>}</div>
            <p>{content || "Le début de votre message apparaîtra ici pendant la rédaction."}</p>
          </div>
          <p className="forum-topic-preview__note">Cet aperçu ne représente pas encore le rendu final du message après publication.</p>
        </div>
      </aside>
    </div>
  );
}
