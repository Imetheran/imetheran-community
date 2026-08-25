# Imetheran

Site communautaire francophone Final Fantasy XIV consacré au rôleplay, aux personnages, aux chroniques et aux échanges entre membres.

Production : `https://imetheran-community.vercel.app`

## Socle technique

- Next.js 16 / App Router / React 19 / TypeScript
- Déploiement Vercel depuis la branche `main`
- Supabase pour l'authentification, PostgreSQL et les règles RLS
- Sessions SSR via `@supabase/ssr`
- Thèmes Dawntrail / Evercold pilotés par variables CSS
- Visuels Final Fantasy XIV issus de sources officielles

## Fonctionnalités déjà en place

- portail d'accueil communautaire ;
- Gazette et Chroniques éditoriales de démonstration ;
- annuaire, fiche et éditeur de personnages ;
- sociogramme interactif ;
- authentification membre avec confirmation e-mail ;
- page **Mon compte** protégée ;
- forum connecté à Supabase : 5 catégories et 15 forums ;
- permissions invité / membre appliquées par RLS ;
- création atomique d'un sujet et de son premier message ;
- réponses, suivi des sujets et état lu / non lu ;
- identité personnage optionnelle dans les espaces RP.

Le forum n'injecte aucune fausse activité : les sujets et messages affichés sont ceux réellement visibles pour la session courante.

## Démarrage local

Créer les variables d'environnement décrites dans `.env.example`, puis :

```bash
npm install
npm run dev
```

Le site local est alors disponible sur `http://localhost:3000`.

## Architecture du forum

Les catégories actuellement initialisées sont :

1. **La Communauté** — lecture possible pour les invités ;
2. **Univers & Rôleplay** — espace hors-RP réservé aux membres ;
3. **Chroniques** — espace RP réservé aux membres ;
4. **Evercold** — campagne RP saisonnière réservée aux membres ;
5. **Final Fantasy XIV** — espace hors-RP actuellement réservé aux membres.

Le compte Supabase reste toujours l'auteur technique d'une publication. Dans les espaces RP, un personnage appartenant au membre peut être associé au sujet ou au message.

## Sécurité

- RLS activé sur les tables exposées ;
- rôles d'autorisation stockés dans `app_metadata` ;
- aucune clé `service_role` ou clé secrète côté client ;
- chemins de retour après authentification limités aux routes internes ;
- écritures principales du forum encapsulées dans des fonctions transactionnelles respectant le RLS.

## Suite

Les prochaines étapes concernent principalement le CMS d'administration, la persistance complète des fiches personnages et relations, la modération du forum, les notifications et l'enrichissement de l'éditeur de messages.
