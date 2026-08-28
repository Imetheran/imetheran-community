import type { Metadata } from "next";
import "./globals.css";
import "./content-hub.css";
import "./home-live.css";
import "./image-quality.css";
import "./gazette-issue.css";
import "./chronicle-hub.css";
import "./chronicle-public-live.css";
import "./character-hub.css";
import "./character-editor.css";
import "./character-actions.css";
import "./character-live.css";
import "./sociogram.css";
import "./forum-hub.css";
import "./forum-access.css";
import "./forum-thread.css";
import "./forum-post-management.css";
import "./bbcode.css";
import "./forum-media.css";
import "./forum-form-focus.css";
import "./forum-daily-use.css";
import "./forum-live.css";
import "./forum-topic-preview.css";
import "./forum-reply-preview.css";
import "./guides.css";
import "./guide-articles.css";
import "./community-tools.css";
import "./maintenance.css";
import "./auth.css";
import "./admin.css";
import "./admin-members.css";
import "./admin-chronicles.css";
import "./admin-gazettes.css";

export const metadata: Metadata = {
  title: {
    default: "Imetheran — Communauté Final Fantasy XIV",
    template: "%s | Imetheran",
  },
  description:
    "Communauté francophone Final Fantasy XIV consacrée au jeu de rôle, aux chroniques et aux personnages.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-theme="dawntrail" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
