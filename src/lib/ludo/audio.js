export class AudioManager {
  constructor(settings = {}) {
    this.settings = settings;
    this.context = null;
    this.musicInterval = null;
    this.step = 0;
    this.isUnlocked = false;
    this.wantsMusic = true;

    // Attach user gesture listener to unlock Web Audio API immediately on first tap/click
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlock();
        if (this.wantsMusic) {
          this.startMusic();
        }
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('click', unlockHandler, { passive: true });
    }
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
      this.context.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.context && this.context.state === 'running') {
      this.isUnlocked = true;
    }
  }

  tone(frequency, duration, volume, type = 'sine') {
    if (this.settings.mute || !volume) return;
    this.unlock();
    if (!this.context) return;

    try {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      const gainVal = (volume / 100) * 0.18;
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(this.context.destination);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {
      // Audio context error fallback
    }
  }

  play(type) {
    this.unlock();
    const soundMap = {
      click: [{ freq: 520, duration: 0.08, type: 'sine' }],
      dice: [
        { freq: 240, duration: 0.08, type: 'triangle' },
        { freq: 360, duration: 0.08, type: 'triangle' },
        { freq: 480, duration: 0.08, type: 'triangle' },
        { freq: 600, duration: 0.12, type: 'sine' }
      ],
      move: [{ freq: 659, duration: 0.12, type: 'sine' }],
      capture: [
        { freq: 440, duration: 0.1, type: 'sawtooth' },
        { freq: 220, duration: 0.25, type: 'triangle' }
      ],
      finish: [
        { freq: 523, duration: 0.12, type: 'triangle' },
        { freq: 659, duration: 0.12, type: 'triangle' },
        { freq: 784, duration: 0.25, type: 'sine' }
      ],
      victory: [
        { freq: 523, duration: 0.15, type: 'triangle' },
        { freq: 659, duration: 0.15, type: 'triangle' },
        { freq: 784, duration: 0.15, type: 'triangle' },
        { freq: 1047, duration: 0.4, type: 'sine' }
      ],
      tickWarning: [
        { freq: 880, duration: 0.06, type: 'sine' },
        { freq: 1100, duration: 0.06, type: 'triangle' }
      ]
    };

    const notes = soundMap[type] || [{ freq: 440, duration: 0.15, type: 'sine' }];
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.tone(note.freq, note.duration, this.settings.sfxVolume ?? 65, note.type);
      }, index * 75);
    });

    if (this.settings.haptic && typeof navigator !== 'undefined' && ['capture', 'finish', 'victory'].includes(type)) {
      navigator.vibrate?.(60);
    }
  }

  startMusic() {
    this.wantsMusic = true;
    this.unlock();
    if (this.musicInterval) return;
    const melody = [262, 330, 392, 523, 392, 330, 294, 349, 440, 587, 440, 349];
    this.musicInterval = setInterval(() => {
      if (!this.settings.mute && (this.settings.musicVolume ?? 20) > 0) {
        const freq = melody[this.step++ % melody.length];
        this.tone(freq, 0.5, (this.settings.musicVolume ?? 20) * 0.8, 'sine');
      }
    }, 600);
  }

  stopMusic() {
    this.wantsMusic = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
