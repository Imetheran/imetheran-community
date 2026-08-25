import Link from "next/link";
import { FeatureIcon } from "./feature-icon";

type FeatureName = "guides" | "chroniques" | "gazettes" | "personnages" | "liens" | "administration";

type FeatureCardProps = {
  name: FeatureName;
  title: string;
  href: string;
  children: React.ReactNode;
};

export function FeatureCard({ name, title, href, children }: FeatureCardProps) {
  return (
    <Link className="feature-card" href={href}>
      <div className="feature-card__icon"><FeatureIcon name={name} /></div>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      <span className="feature-card__arrow" aria-hidden="true">→</span>
    </Link>
  );
}
