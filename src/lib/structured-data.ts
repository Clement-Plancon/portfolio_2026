// schema.org data. Only facts present in the content files are emitted.
import type { ExperienceEntry, ProjectEntry } from './content';
import type { Profile } from './schemas';

export const SITE = 'https://clementplancon.fr';
export const PERSON_ID = `${SITE}/#person`;

export function personLd(profile: Profile, experiences: ExperienceEntry[], skills: string[]) {
  const current = experiences.find((e) => !e.end);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    url: `${SITE}/`,
    jobTitle: profile.jobTitle,
    description: profile.intro,
    email: `mailto:${profile.email}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.location, addressCountry: 'FR' },
    knowsLanguage: ['fr', 'en'],
    knowsAbout: skills,
    sameAs: profile.socials.map((s) => s.url),
    ...(current && {
      worksFor: {
        '@type': 'GovernmentOrganization',
        name: current.organisation,
        ...(current.parentOrganisation && {
          parentOrganization: { '@type': 'GovernmentOrganization', name: current.parentOrganisation },
        }),
      },
    }),
  };
}

export function profilePageLd(path: string, name: string, dateModified?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE}${path}`,
    name,
    inLanguage: 'fr-FR',
    mainEntity: { '@id': PERSON_ID },
    ...(dateModified && { dateModified }),
  };
}

/** The projects of the one-page site, each with its own anchor. Only facts from the content files. */
export function projectsLd(projects: ProjectEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Projets',
    itemListElement: projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: p.title,
        description: p.summary,
        url: `${SITE}/#projet-${p.id}`,
        creator: { '@id': PERSON_ID },
        ...(p.period?.start && { dateCreated: p.period.start }),
        ...(p.technologies.length && { keywords: p.technologies.join(', ') }),
      },
    })),
  };
}
