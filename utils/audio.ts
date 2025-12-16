

// Web Audio API Context Singleton
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Helper to create an oscillator node
const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.1) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playPositiveSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Major chord arpeggio (C5 - E5 - G5) - Bright "Ding"
  playTone(523.25, 'sine', 0.3, now, 0.1);       // C5
  playTone(659.25, 'sine', 0.3, now + 0.1, 0.1); // E5
  playTone(783.99, 'sine', 0.6, now + 0.2, 0.1); // G5
};

export const playNeutralSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Lower pitched descending tones - Gentle "Thud" or "Buzz"
  playTone(300, 'triangle', 0.2, now, 0.1);
  playTone(200, 'triangle', 0.4, now + 0.1, 0.1);
};

export const playFanfareSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Bright sequence indicating completion
  playTone(523.25, 'sine', 0.1, now, 0.1);
  playTone(659.25, 'sine', 0.1, now + 0.1, 0.1);
  playTone(783.99, 'sine', 0.1, now + 0.2, 0.1);
  playTone(1046.50, 'sine', 0.6, now + 0.3, 0.1);
};

export const playErrorSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Discordant sound
  playTone(150, 'sawtooth', 0.4, now, 0.15);
  playTone(140, 'sawtooth', 0.4, now, 0.15);
};

// --- Text to Speech Helpers ---

export const speakText = (text: string, onEnd?: () => void, onStart?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Text-to-speech not supported in this browser.");
    return;
  }

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Configure voice settings for a more natural sound if possible
  utterance.rate = 1.0; 
  utterance.pitch = 1.0;
  
  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.includes('en-US') && !v.name.includes('Microsoft')) || voices.find(v => v.lang.includes('en'));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("Speech synthesis error", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
