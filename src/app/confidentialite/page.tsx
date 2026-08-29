import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Politique de confidentialité et de protection des données personnelles d’Imetheran.",
};

function getRole(appMetadata: unknown) {
  if (!appMetadata || typeof appMetadata !== "object" || !("role" in appMetadata)) return "member";
  return String((appMetadata as { role?: unknown }).role ?? "member");
}

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isAdmin = getRole(claimsData?.claims?.app_metadata) === "admin";

  return (
    <LegalPageShell
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      intro="Cette page explique quelles données Imetheran utilise, pourquoi elles sont nécessaires au fonctionnement de la communauté et comment exercer vos droits."
    >
      <section className="legal-section">
        <h2>Responsable du traitement</h2>
        <p>Le responsable des traitements réalisés directement pour le fonctionnement d’Imetheran est l’éditeur non professionnel du site. Son identité publique est gérée selon la faculté d’anonymat décrite dans les <Link href="/mentions-legales">mentions légales</Link>.</p>
        <p>Pour une demande liée à vos données personnelles, aucun e-mail public n’est nécessaire : un formulaire dédié transmet la demande à l’administration du site.</p>
        <div className="legal-actions">
          <Link className="button button--primary button--small" href="/confidentialite/demande">Exercer mes droits</Link>
          {isAdmin ? <Link className="button button--ghost button--small" href="/administration/demandes-donnees">Gérer les demandes</Link> : null}
        </div>
      </section>

      <section className="legal-section">
        <h2>Données utilisées par Imetheran</h2>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead><tr><th>Catégorie</th><th>Exemples</th><th>Finalité</th><th>Base</th></tr></thead>
            <tbody>
              <tr><td>Compte</td><td>Adresse e-mail, identifiant technique, date de création</td><td>Créer, sécuriser et récupérer le compte</td><td>Exécution du service demandé</td></tr>
              <tr><td>Profil communautaire</td><td>Pseudonyme, nom affiché, biographie, avatar</td><td>Identifier le membre au sein de la communauté</td><td>Exécution du service et choix du membre</td></tr>
              <tr><td>Contenus publiés</td><td>Messages, sujets, fiches de personnages, relations, images</td><td>Faire fonctionner le forum et les outils RP</td><td>Exécution du service</td></tr>
              <tr><td>Modération</td><td>Signalements, statut de participation, actions de modération, notes internes</td><td>Prévenir les abus, appliquer la charte et sécuriser la communauté</td><td>Intérêt légitime de sécurité et de modération</td></tr>
              <tr><td>Notifications</td><td>Réponses, annonces, demandes de relations entre personnages</td><td>Informer le membre de l’activité qui le concerne</td><td>Exécution du service</td></tr>
              <tr><td>Données techniques</td><td>Journaux de serveur, informations de session, données nécessaires à Turnstile</td><td>Sécurité, diagnostic et lutte contre les robots</td><td>Intérêt légitime et sécurité du service</td></tr>
              <tr><td>Demandes RGPD</td><td>E-mail de contact, type de demande, message et suivi</td><td>Répondre aux demandes d’accès, rectification ou suppression</td><td>Obligation légale</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="legal-section">
        <h2>Prestataires techniques</h2>
        <p>Imetheran s’appuie sur des prestataires nécessaires à son fonctionnement. Ils peuvent traiter certaines données pour le compte du site selon leurs rôles respectifs.</p>
        <ul className="legal-list">
          <li><strong>Supabase</strong> : base de données, authentification et stockage des médias. Le projet Imetheran est configuré dans la région Paris.</li>
          <li><strong>Vercel</strong> : hébergement et exécution de l’application web.</li>
          <li><strong>Brevo</strong> : envoi des e-mails transactionnels d’authentification, notamment confirmation d’inscription et récupération du mot de passe.</li>
          <li><strong>Cloudflare Turnstile</strong> : vérification anti-robot lors des opérations d’authentification sensibles.</li>
        </ul>
        <p>Ces prestataires peuvent traiter des métadonnées techniques en dehors de l’Union européenne selon leur infrastructure et leurs sous-traitants. Lorsqu’un transfert international est applicable, il doit reposer sur les mécanismes prévus par le RGPD, notamment les clauses contractuelles types lorsque nécessaire.</p>
      </section>

      <section className="legal-section">
        <h2>Cookies et stockage dans le navigateur</h2>
        <p>Imetheran n’intègre actuellement ni régie publicitaire, ni outil de profilage, ni SDK de mesure d’audience tiers dans son code applicatif.</p>
        <p>Le site utilise cependant des mécanismes strictement liés au service : session d’authentification, sécurité anti-robot et préférences d’interface telles que le thème visuel. Ces usages sont nécessaires à l’authentification, à la sécurité ou à une fonctionnalité demandée par l’utilisateur.</p>
        <div className="legal-callout"><p><strong>Pas de bandeau marketing pour le moment :</strong> tant qu’Imetheran reste limité à ces usages nécessaires et n’ajoute pas de traceurs soumis au consentement, aucun bouton « Accepter tout » n’a de raison d’être. Cette position devra être réévaluée avant l’ajout futur d’analytics, de publicité ou de widgets sociaux traçants.</p></div>
      </section>

      <section className="legal-section">
        <h2>Durées de conservation</h2>
        <ul className="legal-list">
          <li><strong>Compte et profil :</strong> pendant la durée de vie du compte, puis le temps nécessaire à sa suppression technique et au traitement des obligations résiduelles.</li>
          <li><strong>Contenus communautaires :</strong> conservés tant qu’ils participent aux discussions ou récits publiés. Lors de la suppression d’un compte, ils peuvent être supprimés ou anonymisés selon leur nature afin de préserver la cohérence des échanges, sous réserve des droits de la personne concernée.</li>
          <li><strong>Modération et sécurité :</strong> conservées pendant une durée proportionnée aux besoins de sécurité, de prévention des abus et de gestion des contestations ; une référence de douze mois est retenue pour la bêta lorsque aucune raison ne justifie une durée supérieure.</li>
          <li><strong>Demandes relatives aux données :</strong> le dossier de suivi peut être conservé jusqu’à trois ans après sa clôture afin de pouvoir démontrer le traitement de la demande.</li>
          <li><strong>Journaux des prestataires :</strong> soumis aux durées techniques propres à Vercel, Supabase, Cloudflare et Brevo.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>Suppression d’un compte et contenus du forum</h2>
        <p>La suppression d’un compte n’implique pas automatiquement la disparition de toutes les contributions publiques. Lorsque cela est nécessaire pour conserver la lisibilité d’une conversation ou d’une Chronique, un message peut être conservé après dissociation ou anonymisation de son auteur. Une demande spécifique peut néanmoins signaler qu’un contenu contient des données personnelles nécessitant un traitement particulier.</p>
        <p>Les images privées et les fiches de personnages liées au compte sont examinées dans le cadre de la demande de suppression afin de supprimer ce qui n’a plus de raison d’être conservé.</p>
      </section>

      <section className="legal-section">
        <h2>Vos droits</h2>
        <p>Selon votre situation et le fondement du traitement, vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, la portabilité ou vous opposer à certains traitements.</p>
        <p>Une demande peut nécessiter une vérification raisonnable de votre identité lorsque cela est nécessaire pour éviter de communiquer ou supprimer les données d’un autre membre.</p>
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez également introduire une réclamation auprès de la Commission nationale de l’informatique et des libertés (CNIL).</p>
        <div className="legal-actions"><Link className="button button--primary" href="/confidentialite/demande">Déposer une demande</Link></div>
      </section>

      <section className="legal-section">
        <h2>Mise à jour</h2>
        <p>Dernière mise à jour : 29 août 2026. Cette politique sera révisée si Imetheran ajoute de nouveaux services, prestataires, outils de mesure d’audience ou catégories de données.</p>
      </section>
    </LegalPageShell>
  );
}
