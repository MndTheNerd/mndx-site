import { describe, expect, it } from 'vitest';
import { runDuration, shouldPlay, timeline } from '../../src/scripts/walkthrough';

describe('timeline', () => {
  it('walks spec → (approve) → plan → (approve) → build → verify → ship with the spec timings', () => {
    // 4 segments × 700 ms; each signal holds at stop 900 ms, then clears in 300 ms (spec 002, AC6).
    expect(timeline()).toEqual([
      { at: 0, action: 'station', index: 0 },
      { at: 900, action: 'approve', index: 0 },
      { at: 1200, action: 'segment', index: 0 },
      { at: 1900, action: 'station', index: 1 },
      { at: 2800, action: 'approve', index: 1 },
      { at: 3100, action: 'segment', index: 1 },
      { at: 3800, action: 'station', index: 2 },
      { at: 3800, action: 'segment', index: 2 },
      { at: 4500, action: 'station', index: 3 },
      { at: 4500, action: 'segment', index: 3 },
      { at: 5200, action: 'station', index: 4 },
      { at: 5200, action: 'final', index: 0 },
    ]);
  });

  it('runs about 5.2 seconds, within the 8 second limit', () => {
    expect(runDuration()).toBe(5200);
    expect(runDuration()).toBeLessThanOrEqual(8000);
  });
});

describe('shouldPlay', () => {
  it('needs half of a short diagram to be visible', () => {
    expect(shouldPlay(149, 300, 800)).toBe(false);
    expect(shouldPlay(150, 300, 800)).toBe(true);
  });

  it('needs only half the viewport when the diagram is taller than the viewport', () => {
    // A tall vertical diagram on a phone could never be 50 % visible.
    expect(shouldPlay(421, 1200, 844)).toBe(false);
    expect(shouldPlay(422, 1200, 844)).toBe(true);
  });

  it('never plays an empty or hidden diagram', () => {
    expect(shouldPlay(0, 0, 800)).toBe(false);
  });
});
