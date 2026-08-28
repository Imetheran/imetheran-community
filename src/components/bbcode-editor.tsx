"use client";

import { useRef, useState } from "react";
import { BbcodeContent } from "@/components/bbcode-content";

type BbcodeEditorProps = {
  name: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  rows?: number;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  previewMode?: "toggle" | "none";
};

export function BbcodeEditor({
  name,
  id,
  value,
  defaultValue = "",
  onChange,
  rows = 10,
  minLength,
  maxLength = 50000,
  required,
  placeholder,
  ariaLabel,
  previewMode = "toggle",
}: BbcodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [color, setColor] = useState("#c9a86a");
  const [size, setSize] = useState("120");
  const currentValue = value ?? internalValue;

  const commit = (nextValue: string, selectionStart?: number, selectionEnd?: number) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);

    if (selectionStart !== undefined) {
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
      });
    }
  };

  const wrapSelection = (openTag: string, closeTag: string, placeholderText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentValue.slice(start, end) || placeholderText;
    const replacement = `${openTag}${selected}${closeTag}`;
    const nextValue = `${currentValue.slice(0, start)}${replacement}${currentValue.slice(end)}`;
    const selectionStart = start + openTag.length;
    commit(nextValue, selectionStart, selectionStart + selected.length);
  };

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;
    commit(nextValue, start + token.length);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selected = currentValue.slice(textarea.selectionStart, textarea.selectionEnd);
    const suggested = /^https?:\/\//i.test(selected) ? selected : "https://";
    const href = window.prompt("Adresse du lien", suggested);
    if (!href) return;
    wrapSelection(`[url=${href}]`, "[/url]", selected || "Texte du lien");
  };

  return (
    <div className="bbcode-editor">
      <div className="bbcode-editor__toolbar" role="toolbar" aria-label="Mise en forme BBCode">
        <div className="bbcode-editor__group">
          <button type="button" onClick={() => wrapSelection("[b]", "[/b]", "texte")} title="Gras"><strong>B</strong></button>
          <button type="button" onClick={() => wrapSelection("[i]", "[/i]", "texte")} title="Italique"><em>I</em></button>
          <button type="button" onClick={() => wrapSelection("[u]", "[/u]", "texte")} title="Souligné"><u>U</u></button>
          <button type="button" onClick={() => wrapSelection("[s]", "[/s]", "texte")} title="Barré"><s>S</s></button>
        </div>

        <div className="bbcode-editor__group">
          <button type="button" onClick={() => wrapSelection("[h2]", "[/h2]", "Grand titre")} title="Grand titre">H2</button>
          <button type="button" onClick={() => wrapSelection("[h3]", "[/h3]", "Sous-titre")} title="Sous-titre">H3</button>
          <button type="button" onClick={() => wrapSelection("[center]", "[/center]", "texte")} title="Centrer">↔</button>
          <button type="button" onClick={() => wrapSelection("[right]", "[/right]", "texte")} title="Aligner à droite">→</button>
        </div>

        <div className="bbcode-editor__group">
          <button type="button" onClick={insertLink} title="Lien">Lien</button>
          <button type="button" onClick={() => wrapSelection("[quote]", "[/quote]", "Citation")} title="Citation">Citation</button>
          <button type="button" onClick={() => wrapSelection("[code]", "[/code]", "code")} title="Code">Code</button>
          <button type="button" onClick={() => wrapSelection("[spoiler]", "[/spoiler]", "Contenu masqué")} title="Spoiler">Spoiler</button>
          <button type="button" onClick={() => insertToken("\n[hr]\n")} title="Séparateur">―</button>
        </div>

        <div className="bbcode-editor__group bbcode-editor__group--controls">
          <label title="Couleur du texte">
            <span>Couleur</span>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          </label>
          <button type="button" onClick={() => wrapSelection(`[color=${color}]`, "[/color]", "texte")}>Appliquer</button>
          <label>
            <span>Taille</span>
            <select value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="80">80%</option>
              <option value="100">100%</option>
              <option value="120">120%</option>
              <option value="150">150%</option>
              <option value="180">180%</option>
            </select>
          </label>
          <button type="button" onClick={() => wrapSelection(`[size=${size}]`, "[/size]", "texte")}>Appliquer</button>
        </div>

        {previewMode === "toggle" ? (
          <button className="bbcode-editor__preview-toggle" type="button" onClick={() => setPreviewOpen((open) => !open)} aria-expanded={previewOpen}>
            {previewOpen ? "Masquer l’aperçu" : "Aperçu"}
          </button>
        ) : null}
      </div>

      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={currentValue}
        onChange={(event) => commit(event.target.value)}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />

      <div className="bbcode-editor__hint">
        <span>BBCode activé</span>
        <small>Le HTML brut est affiché comme texte pour protéger la communauté.</small>
        {maxLength ? <small>{currentValue.length.toLocaleString("fr-FR")} / {maxLength.toLocaleString("fr-FR")}</small> : null}
      </div>

      {previewMode === "toggle" && previewOpen ? (
        <div className="bbcode-editor__preview" aria-label="Aperçu du message">
          <div className="bbcode-editor__preview-heading"><span>Aperçu</span><small>Rendu tel qu’il apparaîtra sur le forum</small></div>
          <BbcodeContent content={currentValue || "Votre aperçu apparaîtra ici."} />
        </div>
      ) : null}
    </div>
  );
}
