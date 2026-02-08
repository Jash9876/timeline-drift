class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Default volume

        // Ambient music (Hosted on GitHub LFS to bypass Vercel 100MB limit)
        this.ambientAudio = new Audio('https://media.githubusercontent.com/media/Jash9876/timeline-drift/main/audio/ambient.webm');
        this.ambientAudio.loop = true;
        this.ambientAudio.volume = 0.4;
        this.ambientSource = null;

        this.isMuted = false;
        this.isPlaying = false;
        this.loadState(); // Load saved mute preference
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- AMBIENT MUSIC PLAYBACK ---
    startAmbient() {
        this.resume();
        this.isPlaying = true;

        if (this.isMuted) return;

        // Try to play. If blocked, it will be caught. 
        // We don't return early so that subsequent interactions can try again.
        if (this.ambientAudio.paused) {
            this.ambientAudio.play().catch(err => {
                console.warn('Ambient music autoplay blocked:', err);
            });
        }

        // Connect to Web Audio API for volume control
        if (!this.ambientSource) {
            this.ambientSource = this.ctx.createMediaElementSource(this.ambientAudio);
            this.ambientSource.connect(this.masterGain);
        }
    }

    stopAmbient() {
        this.isPlaying = false;
        if (this.ambientAudio) {
            this.ambientAudio.pause();
            this.ambientAudio.currentTime = 0; // Reset to beginning
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            if (this.ambientAudio) this.ambientAudio.pause();
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else {
            if (this.isPlaying && this.ambientAudio) {
                this.ambientAudio.play().catch(e => console.warn(e));
            }
            this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        }

        this.saveState();
        return this.isMuted;
    }

    loadState() {
        const saved = localStorage.getItem('timeline_audio_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.isMuted = settings.isMuted;
            if (this.isMuted) {
                this.masterGain.gain.value = 0;
            }
        }
    }

    saveState() {
        const settings = {
            isMuted: this.isMuted
        };
        localStorage.setItem('timeline_audio_settings', JSON.stringify(settings));
    }

    // Called every turn to modulate sound
    update(metrics) {
        // With audio file, we can adjust volume based on metrics
        if (!this.ambientAudio) return;

        const avg = (metrics.stability + metrics.economy + metrics.environment) / 3;

        // Adjust volume based on world state (subtle effect)
        const targetVolume = 0.3 + (avg / 100) * 0.2; // 0.3 to 0.5
        this.ambientAudio.volume = targetVolume;
    }

    // --- SFX GENERATOR ---
    playTone(freq, type, duration, vol = 0.1) {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHover() {
        // High tech chirp
        this.playTone(800, 'sine', 0.05, 0.05);
    }

    playClick() {
        // Satisfying "thock"
        this.playTone(150, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.1, 0.05), 20);
    }

    playAlarm() {
        // Glitchy burst
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        // Tremolo
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 20;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(now + 0.5);
    }
}
