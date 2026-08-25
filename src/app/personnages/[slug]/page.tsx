import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { characters, getCharacterBySlug } from "@/content/character-content";

export function generateStaticParams() {
  return characters.map((character) => ({ slug: character.slug }));
}

export default async function CharacterProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const character = getCharacterBySlug(slug);

  if (!character) notFound();

  return (
    <main className="site-shell character-profile-page">
      <SiteHeader />

      <section className="character-profile-hero" aria-labelledby="character-name">
        <div className="character-profile-hero__image" aria-hidden="true" />
        <div className="character-profile-hero__veil" aria-hidden="true" />
        <div className="content-frame character-profile-hero__content">
          <div className="character-profile-hero__nav">
            <Link className="character-profile-hero__back" href="/personnages">← Tous les personnages</Link>
            <Link className="button button--ghost button--small" href={`/personnages/${character.slug}/modifier`}>Modifier cette fiche</Link>
          </div>
          <div className="character-profile-hero__layout">
            <div className="character-profile-portrait" aria-hidden="true">
              <span>{character.initials}</span>
              <small>Portrait à importer</small>
            </div>
            <div className="character-profile-identity">
              <div className="character-profile-identity__meta">
                <span className="status-pill">Actif · Démo</span>
                <span>Fiche publique de démonstration</span>
              </div>
              <p className="eyebrow">Personnage rôleplay</p>
              <h1 id="character-name">{character.displayName}</h1>
              <p className="character-profile-identity__epithet">{character.epithet}</p>
              <blockquote>« {character.quote} »</blockquote>
              <div className="character-profile-identity__tags">
                {character.traits.map((trait) => <span key={trait}>{trait}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="character-profile content-frame" aria-label={`Fiche de ${character.displayName}`}>
        <aside className="character-profile__sidebar">
          <section className="character-info-card">
            <p className="character-info-card__label">Repères</p>
            <dl>
              <div><dt>Peuple</dt><dd>{character.people}</dd></div>
              <div><dt>Âge</dt><dd>{character.age}</dd></div>
              <div><dt>Origine</dt><dd>{character.origin}</dd></div>
              <div><dt>Résidence</dt><dd>{character.residence}</dd></div>
              <div><dt>Occupation</dt><dd>{character.occupation}</dd></div>
              <div><dt>Affiliation</dt><dd>{character.affiliation}</dd></div>
              <div><dt>Monde</dt><dd>{character.world}</dd></div>
            </dl>
          </section>

          <section className="character-info-card character-info-card--summary">
            <p className="character-info-card__label">En quelques mots</p>
            <p>{character.summary}</p>
          </section>

          <section className="character-info-card">
            <p className="character-info-card__label">Visibilité</p>
            <p className="character-info-card__small">
              Profil public de démonstration. À terme, le membre pourra gérer la visibilité de sa fiche et l’administration pourra la modérer ou la mettre en avant.
            </p>
          </section>
        </aside>

        <article className="character-profile__main">
          <section className="character-profile-section character-profile-section--biography">
            <p className="panel__kicker">Histoire</p>
            <h2>Parcours</h2>
            <div className="character-profile-section__prose">
              {character.biography.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </section>

          <section className="character-profile-section">
            <div className="character-profile-section__heading">
              <div>
                <p className="panel__kicker">Rencontres possibles</p>
                <h2>Accroches RP</h2>
              </div>
              <span className="status-pill status-pill--quiet">Ouvert au jeu</span>
            </div>
            <div className="character-hooks">
              {character.hooks.map((hook, index) => (
                <article className="character-hook" key={hook.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{hook.title}</h3>
                  <p>{hook.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="character-profile-section">
            <div className="character-profile-section__heading">
              <div>
                <p className="panel__kicker">Sociogramme</p>
                <h2>Relations</h2>
              </div>
              <Link className="text-link" href="/liens">Voir les liens <span aria-hidden="true">→</span></Link>
            </div>
            {character.relations.length > 0 ? (
              <div className="character-relations">
                {character.relations.map((relation) => (
                  <article className="character-relation" key={`${relation.name}-${relation.relation}`}>
                    <div className="character-relation__avatar" aria-hidden="true">?</div>
                    <div>
                      <small>{relation.relation}</small>
                      <h3>{relation.name}</h3>
                      <p>{relation.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="character-profile-section__empty">Aucune relation renseignée pour cette fiche de démonstration.</p>
            )}
          </section>

          <section className="character-profile-section">
            <p className="panel__kicker">Traces communautaires</p>
            <h2>Activité RP</h2>
            {character.activity.length > 0 ? (
              <div className="character-activity">
                {character.activity.map((item, index) => (
                  <article key={`${item.type}-${item.title}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <small>{item.type === "chronicle" ? "Chronique" : item.type === "forum" ? "Forum" : "Événement"}</small>
                      <h3>{item.title}</h3>
                      <p>{item.meta}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="character-profile-section__empty">Aucune activité liée pour le moment.</p>
            )}
          </section>
        </article>
      </section>
    </main>
  );
}
