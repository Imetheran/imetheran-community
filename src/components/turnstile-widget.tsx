"use client";

import { useEffect, useRef, useState } from "react";

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

type VerificationState = "checking" | "ready" | "error";

function getTurnstile() {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

export function TurnstileWidget({ siteKey, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>("checking");

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

    const setToken = (token: string, state: VerificationState) => {
      tokenInput.value = token;
      setVerificationState(state);
      if (submitButton) submitButton.disabled = !token;
    };

    setToken("", "checking");

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
        callback: (token) => setToken(token, "ready"),
        "expired-callback": () => setToken("", "checking"),
        "error-callback": () => setToken("", "error"),
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

  const statusText = verificationState === "ready"
    ? "Vérification anti-robot terminée. Le formulaire peut être envoyé."
    : verificationState === "error"
      ? "La vérification anti-robot a rencontré un problème. Réessayez le contrôle."
      : "Vérification anti-robot en cours. Le formulaire sera disponible une fois le contrôle terminé.";

  return (
    <div
      className="auth-captcha"
      aria-label="Vérification anti-robot"
      aria-busy={verificationState === "checking"}
    >
      <input ref={tokenRef} type="hidden" name="captcha_token" />
      <div ref={containerRef} />
      <small role="status" aria-live="polite">{statusText}</small>
    </div>
  );
}
