// TEST ONLY — serves the test media of the content scenarios (tests/fixtures/scenarios/media).
// Injected only when CONTENT_SCENARIOS=1 (astro.config.mjs).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import { FIXTURE_MEDIA } from './data';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const ref = `media/${params.file}`;
  const m = FIXTURE_MEDIA[ref];
  if (!m) return new Response('Not found', { status: 404 });
  const bytes = await readFile(join(process.cwd(), 'tests/fixtures/scenarios/media', String(params.file)));
  return new Response(bytes, { headers: { 'Content-Type': m.type, 'Cache-Control': 'no-store' } });
};
