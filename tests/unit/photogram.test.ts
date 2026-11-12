// Project visuals are generated: they must be stable, well-formed and cover every option of the admin.
import { describe, expect, it } from 'vitest';
import { emphasis, plain } from '../../src/lib/format';
import { PHOTOGRAM_LABELS, photogram, TONES } from '../../src/lib/photogram';
import { COVER_COLORS, PICTOGRAMS } from '../../src/lib/schemas';

describe('photogram', () => {
  it('is deterministic: the same project always gets the same print', () => {
    expect(photogram('bercy-vert', 'sapin', 'feuille')).toEqual(photogram('bercy-vert', 'sapin', 'feuille'));
    expect(photogram('bercy-vert').edge).not.toEqual(photogram('datametre').edge);
  });

  it('draws every kind of objects the admin offers, with numbers only (no NaN)', () => {
    for (const kind of PICTOGRAMS) {
      const p = photogram(`test-${kind}`, 'ardoise', kind);
      expect(p.objects.length, kind).toBeGreaterThan(50);
      expect(p.objects, kind).not.toMatch(/NaN|undefined/);
      expect(PHOTOGRAM_LABELS[kind]).toBeTruthy();
    }
  });

  it('keeps the brushed edge inside the unit box (it is a clip path in objectBoundingBox units)', () => {
    const nums = photogram('referentiel-indicateurs').edge.match(/[\d.]+/g)!.map(Number);
    expect(nums.length).toBeGreaterThan(300);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(1);
  });

  it('has a toning for every stored colour, dark enough for white objects', () => {
    for (const c of COVER_COLORS) {
      const hex = TONES[c].deep;
      const [r, g, b] = [1, 3, 5].map((i) => {
        const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      const contrast = 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
      expect(contrast, c).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('emphasis', () => {
  it('escapes HTML and turns *word* into the developing italic', () => {
    expect(emphasis('Je rends *lisible* <b>ce</b>')).toBe('Je rends <em class="develop">lisible</em> &lt;b&gt;ce&lt;/b&gt;');
    expect(plain('Je rends *lisible*.')).toBe('Je rends lisible.');
  });
});
