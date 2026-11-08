// Admin API, served at /api/admin/*. All logic lives in src/server (tested without Netlify).
import { getUser, verifyRequestOrigin } from '@netlify/identity';
import type { Config } from '@netlify/functions';
import { parseAdminEmails } from '../../src/server/auth';
import { Cms } from '../../src/server/cms';
import { GitHub } from '../../src/server/github';
import { createHandler } from '../../src/server/handler';

const env = process.env;
const cms =
  env.GITHUB_TOKEN && env.GITHUB_REPO
    ? new Cms(new GitHub({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO }), {
        branch: env.GITHUB_BRANCH || 'main',
        draftBranch: env.GITHUB_DRAFT_BRANCH || 'cms-draft',
      })
    : null;

export default createHandler({
  cms,
  getUser: () => getUser(),
  verifyOrigin: (req) => verifyRequestOrigin(req),
  adminEmails: parseAdminEmails(env.ADMIN_EMAILS),
  previewUrl: env.PREVIEW_URL || undefined,
});

export const config: Config = { path: '/api/admin/*' };
