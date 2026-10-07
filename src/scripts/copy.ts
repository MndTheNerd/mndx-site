export type CopyOutcome = 'copied' | 'failed';

interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

/** Copies text, resolving to 'failed' (never throwing) when the Clipboard API is missing or refuses. */
export async function copyText(text: string, clipboard: ClipboardWriter | undefined): Promise<CopyOutcome> {
  if (!clipboard) return 'failed';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** What to tell the visitor when copying fails, worded for touch or keyboard. */
export function failureMessage(isCoarsePointer: boolean): string {
  return isCoarsePointer ? 'Select the command and copy it' : 'Press Ctrl+C or ⌘C to copy';
}

const LABEL_RESET_MS = 2000;
const FAILURE_CLEAR_MS = 6000;

function selectContents(element: Element): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Turns on every `[data-copy]` block's copy button (hidden until now, so it never shows without JavaScript)
 * and handles copying, the "Copied" label and the failure fallback (spec 002, AC2–AC4).
 */
export function initCopyButtons(root: ParentNode): void {
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  for (const block of root.querySelectorAll<HTMLElement>('[data-copy]')) {
    const text = block.querySelector<HTMLElement>('[data-copy-text]');
    const button = block.querySelector<HTMLButtonElement>('[data-copy-button]');
    const label = block.querySelector<HTMLElement>('[data-copy-label]');
    const status = block.querySelector<HTMLElement>('[data-copy-status]');
    if (!text || !button || !label || !status) continue;

    let resetTimer: number | undefined;
    const reset = () => {
      window.clearTimeout(resetTimer);
      label.textContent = 'Copy';
      delete button.dataset['state'];
      status.textContent = '';
      delete status.dataset['kind'];
    };

    let activation = 0;
    button.hidden = false;
    button.addEventListener('click', async () => {
      const current = (activation += 1);
      // Clearing first makes a repeated "Copied" a new announcement for screen readers.
      reset();
      const outcome = await copyText(text.textContent?.trim() ?? '', navigator.clipboard);
      // A newer click owns the label and timer; an older copy finishing late must not overwrite them.
      if (current !== activation) return;
      if (outcome === 'copied') {
        label.textContent = 'Copied';
        button.dataset['state'] = 'copied';
        status.textContent = 'Copied';
        resetTimer = window.setTimeout(reset, LABEL_RESET_MS);
      } else {
        selectContents(text);
        status.dataset['kind'] = 'failed';
        status.textContent = failureMessage(coarsePointer.matches);
        resetTimer = window.setTimeout(reset, FAILURE_CLEAR_MS);
      }
    });
  }
}
