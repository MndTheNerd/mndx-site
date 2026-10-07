import { describe, expect, it } from 'vitest';
import { copyText, failureMessage } from '../../src/scripts/copy';

describe('copyText', () => {
  it('writes exactly the given text and reports success', async () => {
    const written: string[] = [];
    const clipboard = { writeText: async (text: string) => void written.push(text) };

    await expect(copyText('claude plugin install mndx@mndx', clipboard)).resolves.toBe('copied');
    expect(written).toEqual(['claude plugin install mndx@mndx']);
  });

  it('reports failure when the Clipboard API is missing', async () => {
    await expect(copyText('anything', undefined)).resolves.toBe('failed');
  });

  it('reports failure (without throwing) when the write is rejected', async () => {
    const clipboard = { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) };
    await expect(copyText('anything', clipboard)).resolves.toBe('failed');
  });
});

describe('failureMessage', () => {
  it('tells keyboard and mouse users which shortcut to press', () => {
    expect(failureMessage(false)).toBe('Press Ctrl+C or ⌘C to copy');
  });

  it('tells touch users to select and copy', () => {
    expect(failureMessage(true)).toBe('Select the command and copy it');
  });
});
