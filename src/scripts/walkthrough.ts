/** Time for the route to cross one track segment. Matches --dur-step in tokens.css. */
export const STEP_MS = 700;
/** How long the route waits at a red signal before /mndx:approve clears it. */
export const SIGNAL_STOP_MS = 900;
/** How long the signal takes to switch to proceed before the route moves on. */
export const SIGNAL_CLEAR_MS = 300;

const STATIONS = 5; // spec, plan, build, verify, ship
const SIGNALLED_SEGMENTS = 2; // spec→plan and plan→build each have a signal

export interface TimelineEvent {
  at: number;
  action: 'station' | 'approve' | 'segment' | 'final';
  index: number;
}

/** The walkthrough's events in order (spec 002, AC6). */
export function timeline(): readonly TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let at = 0;
  for (let segment = 0; segment < STATIONS - 1; segment += 1) {
    events.push({ at, action: 'station', index: segment });
    if (segment < SIGNALLED_SEGMENTS) {
      at += SIGNAL_STOP_MS;
      events.push({ at, action: 'approve', index: segment });
      at += SIGNAL_CLEAR_MS;
    }
    events.push({ at, action: 'segment', index: segment });
    at += STEP_MS;
  }
  events.push({ at, action: 'station', index: STATIONS - 1 });
  events.push({ at, action: 'final', index: 0 });
  return events;
}

export function runDuration(): number {
  return timeline().at(-1)?.at ?? 0;
}

/**
 * True once enough of the diagram is on screen: half of it, or half the viewport when the diagram is taller
 * than that (a tall vertical diagram on a phone could otherwise never qualify).
 */
export function shouldPlay(visibleHeight: number, diagramHeight: number, viewportHeight: number): boolean {
  if (diagramHeight <= 0) return false;
  return visibleHeight >= Math.min(diagramHeight / 2, viewportHeight / 2);
}

const STEP_CLASSES = ['is-reached', 'is-drawn', 'is-clear', 'is-lit'];

/**
 * Plays the diagram once when enough of it is visible, offers "Run it again", and respects reduced motion,
 * including when it is switched on mid-run (spec 002, AC6–AC7). Visuals are driven by classes and
 * data-state only; the CSS in TrackDiagram.astro does the rest.
 */
export function initWalkthrough(figure: HTMLElement): void {
  const replay = figure.querySelector<HTMLButtonElement>('[data-replay]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timers: number[] = [];

  const mark = (selector: string, className: string) => {
    for (const element of figure.querySelectorAll(selector)) element.classList.add(className);
  };

  // Plays the first run when enough of the diagram is visible. Created up front because run() disconnects it.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (shouldPlay(entry.intersectionRect.height, entry.boundingClientRect.height, window.innerHeight)) {
          run();
        }
      }
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  );

  // aria-disabled rather than disabled, so a keyboard user's focus stays on the button during a run.
  const setReplayDisabled = (isDisabled: boolean) =>
    replay?.setAttribute('aria-disabled', String(isDisabled));

  const finish = () => {
    for (const timer of timers) window.clearTimeout(timer);
    timers = [];
    figure.dataset['state'] = 'final';
    setReplayDisabled(false);
  };

  const apply = (event: TimelineEvent) => {
    switch (event.action) {
      case 'station':
        mark(`[data-station="${event.index}"]`, 'is-reached');
        break;
      case 'approve':
        mark(`[data-approve="${event.index}"]`, 'is-lit');
        mark(`[data-signal="${event.index}"]`, 'is-clear');
        break;
      case 'segment':
        mark(`[data-segment="${event.index}"]`, 'is-drawn');
        break;
      case 'final':
        finish();
        break;
    }
  };

  const run = () => {
    // Whatever starts the first run (scrolling or the button), the automatic trigger is spent: it plays once.
    observer.disconnect();
    if (reducedMotion.matches) return finish();
    for (const timer of timers) window.clearTimeout(timer);
    // Snap back to the initial state with transitions off, so a replay doesn't animate backwards.
    figure.setAttribute('data-resetting', '');
    for (const element of figure.querySelectorAll(STEP_CLASSES.map((c) => `.${c}`).join(','))) {
      element.classList.remove(...STEP_CLASSES);
    }
    figure.dataset['state'] = 'playing';
    void figure.getBoundingClientRect(); // flush styles while transitions are off
    figure.removeAttribute('data-resetting');
    setReplayDisabled(true);
    timers = timeline().map((event) => window.setTimeout(() => apply(event), event.at));
  };

  if (reducedMotion.matches) {
    figure.dataset['state'] = 'final';
    return;
  }

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    finish();
    if (replay) replay.hidden = true;
  });

  if (replay) {
    setReplayDisabled(false);
    replay.hidden = false;
    replay.addEventListener('click', () => {
      if (replay.getAttribute('aria-disabled') !== 'true') run();
    });
  }

  observer.observe(figure);
}
