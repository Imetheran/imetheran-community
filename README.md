# Imetheran — phase 1

Première base de développement du site communautaire Final Fantasy XIV.

## Ce qui est déjà en place

- Next.js 16 / App Router / TypeScript
- Accueil responsive
- Menu : Accueil, Guides, Chroniques, Gazettes, Personnages, Liens, Administration
- Bascule complète Dawntrail / Evercold
- Thèmes pilotés par variables CSS
- Titre **Imetheran** personnalisable dans `src/app/globals.css`
- Routes fonctionnelles pour toutes les rubriques
- Visuels distants provenant uniquement des domaines officiels `finalfantasyxiv.com`
- Structure prête pour l'ajout de Supabase

## Modifier le titre

Dans `src/app/globals.css` :

```css
--brand-font-family: Georgia, "Times New Roman", serif;
--brand-font-size: clamp(3.4rem, 8vw, 7.8rem);
--brand-font-weight: 500;
--brand-letter-spacing: 0.08em;
```

La transformation du titre en logo pourra se faire directement dans `src/app/page.tsx`.

## Démarrage local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Suite prévue

1. Brancher le dépôt GitHub et le projet Vercel.
2. Créer le projet Supabase et la couche d'authentification.
3. Concevoir le schéma : profils, personnages, chroniques, gazettes, guides et liens sociaux.
4. Ajouter l'administration avec rôles et RLS Supabase.
5. Développer la fiche personnage puis le sociogramme interactif.

## Sources visuelles officielles utilisées

- Dawntrail : site officiel / univers de Tural
- Evercold : site officiel / médias

Les images restent hébergées par Square Enix dans cette première phase. Une validation de la politique d'utilisation des matériaux doit être faite avant une mise en production publique.
