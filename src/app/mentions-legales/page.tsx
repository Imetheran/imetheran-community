import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales et informations d’hébergement d’Imetheran.",
};

export default function LegalNoticesPage() {
  return (
    <LegalPageShell
      eyebrow="Informations légales"
      title="Mentions légales"
      intro="Les informations ci-dessous identifient le cadre d’édition et d’hébergement d’Imetheran, communauté non officielle consacrée à Final Fantasy XIV."
    >
      <section className="legal-section">
        <h2>Édition du site</h2>
        <p><strong>Imetheran</strong> est un service communautaire édité à titre personnel et non professionnel par une personne physique résidant en France.</p>
        <p>L’éditeur a choisi de préserver son anonymat dans les conditions prévues par l’article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN). Dans ce cadre, les éléments permettant son identification sont destinés à être détenus par le fournisseur d’hébergement et peuvent être communiqués aux autorités compétentes dans les conditions prévues par la loi.</p>
        <div className="legal-callout"><p><strong>Point administratif avant ouverture publique :</strong> l’éditeur doit s’assurer que le compte d’hébergement contient bien les éléments d’identification requis par la LCEN pour bénéficier de cette faculté d’anonymat.</p></div>
        <dl className="legal-definition">
          <div><dt>Nom du service</dt><dd>Imetheran</dd></div>
          <div><dt>Nature</dt><dd>Communauté francophone non commerciale autour de Final Fantasy XIV et du jeu de rôle.</dd></div>
          <div><dt>Directeur de la publication</dt><dd>L’éditeur du site.</dd></div>
          <div><dt>Contact</dt><dd><Link href="/confidentialite/demande">Formulaire de contact relatif aux données et demandes légales</Link>.</dd></div>
        </dl>
      </section>

      <section className="legal-section">
        <h2>Hébergement de l’application</h2>
        <dl className="legal-definition">
          <div><dt>Hébergeur</dt><dd>Vercel Inc.</dd></div>
          <div><dt>Adresse</dt><dd>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</dd></div>
          <div><dt>Téléphone publié par Vercel</dt><dd>+1 559 288 7060</dd></div>
          <div><dt>Site</dt><dd>vercel.com</dd></div>
        </dl>
        <p>L’application web est déployée sur l’infrastructure Vercel.</p>
      </section>

      <section className="legal-section">
        <h2>Base de données, authentification et médias</h2>
        <dl className="legal-definition">
          <div><dt>Prestataire</dt><dd>Supabase, Inc.</dd></div>
          <div><dt>Adresse publiée</dt><dd>c/o Incorporating Services, Ltd., 3500 S. DuPont Highway, Dover, Kent 19901, Delaware, États-Unis.</dd></div>
          <div><dt>Rôle</dt><dd>Base de données PostgreSQL, authentification et stockage des médias communautaires.</dd></div>
          <div><dt>Région du projet Imetheran</dt><dd>Paris, Union européenne.</dd></div>
        </dl>
      </section>

      <section className="legal-section">
        <h2>Propriété intellectuelle et Final Fantasy XIV</h2>
        <p>Imetheran est un projet communautaire indépendant et non officiel. Il n’est ni édité, ni sponsorisé, ni approuvé par SQUARE ENIX CO., LTD.</p>
        <p>FINAL FANTASY XIV, ses noms, marques, univers, éléments graphiques et autres contenus protégés restent la propriété de leurs ayants droit respectifs. FINAL FANTASY XIV © SQUARE ENIX CO., LTD. Tous droits réservés.</p>
        <p>Les contenus originaux publiés par les membres restent soumis aux droits de leurs auteurs. Leur publication sur Imetheran permet leur affichage dans le cadre normal du fonctionnement de la communauté, sans transfert général de propriété intellectuelle à l’éditeur.</p>
      </section>

      <section className="legal-section">
        <h2>Responsabilité et contenus communautaires</h2>
        <p>Imetheran héberge des contenus rédigés par ses membres : messages de forum, fiches de personnages, images et récits. Les membres sont responsables des contenus qu’ils publient et s’engagent à respecter la charte communautaire, les droits des tiers et la législation applicable.</p>
        <p>L’équipe peut modérer, masquer ou supprimer un contenu lorsqu’il contrevient à la charte, porte atteinte aux droits d’un tiers ou présente un risque pour la communauté.</p>
        <div className="legal-actions"><Link className="button button--ghost button--small" href="/guides/charte">Lire la charte</Link><Link className="button button--ghost button--small" href="/confidentialite">Politique de confidentialité</Link></div>
      </section>

      <section className="legal-section">
        <h2>Mise à jour</h2>
        <p>Dernière mise à jour : 29 août 2026. Les présentes mentions pourront évoluer en cas de changement d’hébergeur, de structure juridique ou de fonctionnement du service.</p>
      </section>
    </LegalPageShell>
  );
}
