import type { Metadata } from "next";
import "./globals.css";
import "./content-hub.css";

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
