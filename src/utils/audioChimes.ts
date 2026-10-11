export type RingtonePreset = "digital-beep" | "marimba" | "zen-bell" | "alarm-chime" | "custom";

export interface RingtoneOption {
  id: RingtonePreset;
  name: string;
  description: string;
}

export const RINGTONE_OPTIONS: RingtoneOption[] = [
  { id: "digital-beep", name: "Digital Pulse", description: "Crisp modern electronic two-tone chime" },
  { id: "marimba", name: "Upbeat Marimba", description: "Melodic resonant acoustic notes" },
  { id: "zen-bell", name: "Zen Crystal Bell", description: "Soothing harmonic Tibetan singing chime" },
  { id: "alarm-chime", name: "Classic Alert", description: "Vibrant high-attention reminder chime" },
  { id: "custom", name: "Custom Ringtone", description: "Upload your own MP3/WAV audio chime" },
];

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(preset: RingtonePreset, customDataUrl?: string) {
  try {
    if (preset === "custom" && customDataUrl) {
      const audio = new Audio(customDataUrl);
      audio.volume = 0.9;
      audio.play().catch((e) => console.warn("Failed to play custom audio:", e));
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (preset) {
      case "digital-beep": {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(1320, now + 0.08);

        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.36);
        break;
      }

      case "marimba": {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }

      case "zen-bell": {
        const base = 528;
        const harmonics = [base, base * 1.5, base * 2.02, base * 3.01];
        harmonics.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          const vol = 0.35 / (i + 1);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.25);
        });
        break;
      }

      case "alarm-chime":
      default: {
        [0, 0.16, 0.32].forEach((offset) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(1046.5, t);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
        });
        break;
      }
    }
  } catch (err) {
    console.warn("Could not play sound preview:", err);
  }
}
