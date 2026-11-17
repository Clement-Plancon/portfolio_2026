import type { APIRoute } from 'astro';
import { serveMedia } from '../../server/media-route';

export const prerender = false;
export const GET: APIRoute = ({ params, url }) => serveMedia('media', params.name, url);
