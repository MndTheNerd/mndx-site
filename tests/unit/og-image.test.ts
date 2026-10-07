import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inputsHash } from '../../scripts/og/inputs';

const ROOT = join(import.meta.dirname, '..', '..');
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('share image public/og.png (spec 003, AC3)', () => {
  const png = readFileSync(join(ROOT, 'public', 'og.png'));

  it('is a 1200×630 PNG', () => {
    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it('is at most 300 KB', () => {
    expect(png.length).toBeLessThanOrEqual(300 * 1024);
  });

  it('was regenerated after its inputs last changed (run `npm run og`)', () => {
    const recorded = readFileSync(join(ROOT, 'scripts', 'og', 'inputs.sha256'), 'utf8').trim();
    expect(inputsHash()).toBe(recorded);
  });
});
