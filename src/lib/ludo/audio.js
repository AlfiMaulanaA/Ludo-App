export class AudioManager {
  constructor(settings = {}) {
    this.settings = settings;
    this.context = null;
    this.musicInterval = null;
    this.step = 0;
  }

  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.context) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.context = new AudioCtx();
      }
    }
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  tone(frequency, duration, volume, type = 'sine') {
    if (!this.context || this.settings.mute || !volume) return;
    try {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime((volume / 100) * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(now + duration);
    } catch {
      // Ignore Web Audio errors if audio context was closed
    }
  }

  play(type) {
    this.unlock();
    const soundMap = {
      click: [520],
      dice: [220, 330, 440, 550],
      move: [660],
      capture: [330, 180],
      finish: [523, 659, 784],
      victory: [523, 659, 784, 1047]
    };

    const notes = soundMap[type] || [440];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.tone(freq, 0.18, this.settings.sfxVolume ?? 65, 'triangle');
      }, index * 75);
    });

    if (this.settings.haptic && typeof navigator !== 'undefined' && ['capture', 'finish', 'victory'].includes(type)) {
      navigator.vibrate?.(60);
    }
  }

  startMusic() {
    this.unlock();
    if (this.musicInterval) return;
    const melody = [262, 330, 392, 330, 294, 349, 440, 349];
    this.musicInterval = setInterval(() => {
      if (!this.settings.mute && (this.settings.musicVolume ?? 20) > 0) {
        const freq = melody[this.step++ % melody.length];
        this.tone(freq, 0.7, this.settings.musicVolume, 'sine');
      }
    }, 700);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
