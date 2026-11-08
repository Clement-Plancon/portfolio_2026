import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/lib/markdown';

describe('renderMarkdown (safe pipeline)', () => {
  it('renders regular markdown', () => {
    const html = renderMarkdown('# Titre\n\nUn **mot** et [un lien](https://example.com).');
    expect(html).toContain('<h1>Titre</h1>');
    expect(html).toContain('<strong>mot</strong>');
    expect(html).toContain('<a href="https://example.com" rel="noopener noreferrer">un lien</a>');
  });

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'texte <span onclick="alert(1)">inline</span>',
    '<iframe src="https://evil.example"></iframe>',
  ])('escapes raw HTML: %s', (md) => {
    const html = renderMarkdown(md);
    expect(html).not.toMatch(/<(script|img|span|iframe)\b/i);
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>x</script>', 'vbscript:x'])(
    'drops unsafe link targets: %s',
    (href) => {
      const html = renderMarkdown(`[clic](${href}) ![img](${href})`);
      expect(html).not.toMatch(/href=|src=/);
    },
  );

  it('escapes attribute content', () => {
    const html = renderMarkdown('[a](https://example.com "x\\" onmouseover=\\"alert(1)")');
    expect(html).not.toContain('onmouseover="');
  });
});
