// Admin API (/api/admin/*). All logic lives in src/server (tested without Netlify); this only plugs it into Astro.
import type { APIRoute } from 'astro';
import { adminHandler } from '../../../server/runtime';

export const prerender = false;

export const ALL: APIRoute = ({ request, clientAddress }) => {
  let ip: string | undefined;
  try {
    ip = clientAddress;
  } catch {
    ip = undefined; // not provided by every runtime
  }
  return adminHandler()(request, { ip });
};
