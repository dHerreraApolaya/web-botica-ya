let context: AudioContext | null = null;
let enabled = true;

export const soundEnabled = (): boolean => enabled;
export const setSoundEnabled = (value: boolean): void => {
  enabled = value;
};
export const prepareSound = (): void => {
  if (!enabled || typeof window.AudioContext === 'undefined') return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => undefined);
  } catch {
    context = null;
  }
};
export const playFeedback = async (kind: 'cart' | 'order' | 'error'): Promise<void> => {
  if (!enabled) return;
  prepareSound();
  if (!context) return;
  try {
    if (context.state !== 'running') await context.resume();
    if (!enabled || context.state !== 'running') return;
    const notes =
      kind === 'error' ? [330, 247] : kind === 'cart' ? [660, 880] : [523.25, 659.25, 783.99];
    const start = context.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const time = start + index * 0.09;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.05, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.16);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    return;
  }
};
