// Content types and helpers for the public page. The content itself is read from Netlify Blobs at
// request time (src/server/content-store.ts) and turned into SiteData by src/lib/snapshot.ts.
export type { ExperienceEntry, ProjectEntry, SiteData } from './snapshot';
export { paragraphs } from './snapshot';
