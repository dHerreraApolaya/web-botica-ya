import { afterEach, expect, it, vi } from 'vitest';
import { playFeedback, setSoundEnabled } from './feedback.util';

afterEach(() => {
  vi.unstubAllGlobals();
  setSoundEnabled(true);
  vi.resetModules();
});

it('plays distinct short confirmations and supports mute without breaking the action', async () => {
  const start = vi.fn();
  const frequency = { value: 0 };
  const resume = vi.fn().mockResolvedValue(undefined);
  const createOscillator = vi.fn(() => ({
    frequency,
    connect: vi.fn(),
    start,
    stop: vi.fn(),
    disconnect: vi.fn(),
  }));
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume = resume;
      createOscillator = createOscillator;
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      });
    }
  );
  await playFeedback('cart');
  expect(start).toHaveBeenCalledTimes(2);
  await playFeedback('order');
  expect(start).toHaveBeenCalledTimes(5);
  await playFeedback('error');
  expect(start).toHaveBeenCalledTimes(7);
  setSoundEnabled(false);
  await playFeedback('cart');
  expect(start).toHaveBeenCalledTimes(7);
});

it('does not fail when audio is unavailable', async () => {
  vi.stubGlobal('AudioContext', undefined);
  await expect(playFeedback('order')).resolves.toBeUndefined();
});
