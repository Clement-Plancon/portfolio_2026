export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS },
  });
}

export function errorResponse(e: HttpError): Response {
  return json({ error: { code: e.code, message: e.message, details: e.details } }, e.status);
}

export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > maxBytes) throw new HttpError(413, 'too_large', 'Requête trop volumineuse.');
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', 'Requête trop volumineuse.');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'bad_json', 'Corps de requête invalide.');
  }
}

export { SECURITY_HEADERS };
