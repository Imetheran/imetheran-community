type TurnstileWidgetProps = {
  siteKey?: string;
  action: "login" | "signup" | "recovery";
};

export function TurnstileWidget({ siteKey, action }: TurnstileWidgetProps) {
  if (!siteKey) return null;

  return (
    <div className="auth-captcha" aria-label="Vérification anti-robot">
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-action={action}
        data-language="fr"
        data-size="flexible"
        data-theme="auto"
      />
    </div>
  );
}
