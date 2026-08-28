"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  siteKey?: string;
  action: "login" | "signup" | "recovery";
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      language: string;
      size: "flexible";
      theme: "auto";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

function getTurnstile() {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

export function TurnstileWidget({ siteKey, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!siteKey) return;

    const container = containerRef.current;
    const tokenInput = tokenRef.current;
    if (!container || !tokenInput) return;

    const form = container.closest("form");
    const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]') ?? null;
    let cancelled = false;
    let widgetId: string | null = null;
    let retryTimer: number | null = null;

    const setReady = (token: string) => {
      tokenInput.value = token;
      if (submitButton) submitButton.disabled = !token;
    };

    setReady("");

    const renderWidget = () => {
      if (cancelled) return;
      const turnstile = getTurnstile();
      if (!turnstile) {
        retryTimer = window.setTimeout(renderWidget, 50);
        return;
      }

      widgetId = turnstile.render(container, {
        sitekey: siteKey,
        action,
        language: "fr",
        size: "flexible",
        theme: "auto",
        callback: (token) => setReady(token),
        "expired-callback": () => setReady(""),
        "error-callback": () => setReady(""),
      });
    };

    renderWidget();

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      const turnstile = getTurnstile();
      if (turnstile && widgetId) turnstile.remove(widgetId);
      if (submitButton) submitButton.disabled = false;
    };
  }, [siteKey, action]);

  if (!siteKey) return null;

  return (
    <div className="auth-captcha" aria-label="Vérification anti-robot">
      <input ref={tokenRef} type="hidden" name="captcha_token" />
      <div ref={containerRef} />
      <small>La connexion devient disponible une fois la vérification anti-robot terminée.</small>
    </div>
  );
}
