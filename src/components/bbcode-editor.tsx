"use client";

import { useRef, useState } from "react";
import { BbcodeContent } from "@/components/bbcode-content";
import {
  extractForumMediaIds,
  FORUM_MEDIA_BUCKET,
  FORUM_MEDIA_MAX_BYTES,
  FORUM_MEDIA_MAX_PER_POST,
  forumMediaExtension,
  type ForumMediaRenderMap,
} from "@/lib/forum-media";
import { createClient } from "@/lib/supabase/client";

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
  initialMediaMap?: ForumMediaRenderMap;
  onMediaMapChange?: (mediaMap: ForumMediaRenderMap) => void;
};

function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      if (!width || !height) reject(new Error("dimensions"));
      else resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("invalid-image"));
    };
    image.src = objectUrl;
  });
}

function cleanAltText(value: string) {
  return value
    .replace(/[\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

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
  initialMediaMap = {},
  onMediaMapChange,
}: BbcodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [color, setColor] = useState("#c9a86a");
  const [size, setSize] = useState("120");
  const [mediaMap, setMediaMap] = useState<ForumMediaRenderMap>(initialMediaMap);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
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

  const uploadImage = async (file: File) => {
    setImageError(null);

    if (extractForumMediaIds(currentValue).length >= FORUM_MEDIA_MAX_PER_POST) {
      setImageError(`Un message peut contenir au maximum ${FORUM_MEDIA_MAX_PER_POST} images.`);
      return;
    }

    const extension = forumMediaExtension(file.type);
    if (!extension) {
      setImageError("Format non pris en charge. Utilisez JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size <= 0 || file.size > FORUM_MEDIA_MAX_BYTES) {
      setImageError("L’image doit peser au maximum 5 Mo.");
      return;
    }

    setUploadingImage(true);
    const supabase = createClient();
    let mediaId = "";
    let storagePath = "";
    let rowCreated = false;
    let objectCreated = false;

    try {
      const [{ data: userData, error: userError }, dimensions] = await Promise.all([
        supabase.auth.getUser(),
        imageDimensions(file),
      ]);
      const user = userData.user;
      if (userError || !user) throw new Error("auth");
      if (dimensions.width > 10000 || dimensions.height > 10000) throw new Error("dimensions-limit");

      mediaId = crypto.randomUUID();
      storagePath = `${user.id}/${mediaId}.${extension}`;

      const { error: mediaError } = await supabase.from("forum_media").insert({
        id: mediaId,
        owner_id: user.id,
        storage_path: storagePath,
        mime_type: file.type,
        byte_size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });
      if (mediaError) throw mediaError;
      rowCreated = true;

      const { error: uploadError } = await supabase.storage
        .from(FORUM_MEDIA_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      objectCreated = true;

      const { data: signedData, error: signedError } = await supabase.storage
        .from(FORUM_MEDIA_BUCKET)
        .createSignedUrl(storagePath, 3600);
      if (signedError || !signedData?.signedUrl) throw signedError ?? new Error("signed-url");

      const suggestedAlt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Image du message";
      const requestedAlt = window.prompt("Texte alternatif de l’image", suggestedAlt);
      const alt = cleanAltText(requestedAlt ?? suggestedAlt) || "Image du message";

      const nextMediaMap: ForumMediaRenderMap = {
        ...mediaMap,
        [mediaId.toLowerCase()]: {
          url: signedData.signedUrl,
          width: dimensions.width,
          height: dimensions.height,
        },
      };
      setMediaMap(nextMediaMap);
      onMediaMapChange?.(nextMediaMap);
      insertToken(`\n[img=${mediaId}]${alt}[/img]\n`);
      setPreviewOpen(true);
    } catch (error) {
      if (objectCreated && storagePath) {
        await supabase.storage.from(FORUM_MEDIA_BUCKET).remove([storagePath]);
      }
      if (rowCreated && mediaId) {
        await supabase.from("forum_media").delete().eq("id", mediaId);
      }

      const message = error instanceof Error ? error.message : "";
      if (message === "auth") setImageError("Votre session a expiré. Reconnectez-vous avant d’envoyer une image.");
      else if (message === "dimensions-limit") setImageError("Cette image est trop grande en dimensions. Limite : 10 000 × 10 000 pixels.");
      else setImageError("L’image n’a pas pu être envoyée. Vérifiez le fichier puis réessayez.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return (
    <div className="bbcode-editor">
      <input
        ref={imageInputRef}
        className="bbcode-editor__image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadImage(file);
        }}
      />

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
          <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} title="Envoyer une image">
            {uploadingImage ? "Envoi…" : "Image"}
          </button>
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
          <button
            className="bbcode-editor__preview-toggle"
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            aria-expanded={previewOpen}
            aria-label={previewOpen ? "Revenir à l’édition du message" : "Prévisualiser le message"}
          >
            {previewOpen ? "← Revenir à l’édition" : "Prévisualiser le message"}
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
        <small>Images privées : JPEG, PNG, WebP ou GIF · 5 Mo max · 8 par message.</small>
        <small>Le HTML brut est affiché comme texte pour protéger la communauté.</small>
        {maxLength ? <small>{currentValue.length.toLocaleString("fr-FR")} / {maxLength.toLocaleString("fr-FR")}</small> : null}
      </div>
      {imageError ? <div className="bbcode-editor__media-error" role="alert">{imageError}</div> : null}

      {previewMode === "toggle" && previewOpen ? (
        <div className="bbcode-editor__preview" aria-label="Prévisualisation du message">
          <div className="bbcode-editor__preview-heading"><span>Prévisualisation</span><small>Rendu tel qu’il apparaîtra sur le forum</small></div>
          <BbcodeContent content={currentValue || "Votre prévisualisation apparaîtra ici."} mediaMap={mediaMap} />
        </div>
      ) : null}
    </div>
  );
}
