class GameController {
    constructor() {
        this.auth = new AuthSystem();
        this.leaderboard = new LeaderboardSystem(this.auth);
        this.engine = new GameEngine();
        this.ui = new UIManager();
        this.sound = new SoundManager();
        this.visualizer = new Visualizer('timeline-canvas');

        this.currentCard = null;
        this.isGameActive = false;

        this.initEventListeners();
        this.checkAuth();
        this.enableAudioOnInteraction(); // Start music on first click/type
    }

    // Enable audio context on first user gesture (fix for autoplay policy)
    enableAudioOnInteraction() {
        const startAudio = () => {
            this.sound.resume();
            this.sound.startAmbient();
            // Remove listeners once activated
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
    }

    initEventListeners() {
        // Auth Forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value;
            const p = document.getElementById('login-password').value;
            const res = this.auth.login(u, p);
            if (res.success) this.onLoginSuccess(res.user);
            else alert(res.message);
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('signup-username').value;
            const p = document.getElementById('signup-password').value;
            const res = this.auth.signup(u, p);
            if (res.success) this.onLoginSuccess(res.user);
            else alert(res.message);
        });

        // Switch Auth Mode
        document.getElementById('to-signup').addEventListener('click', () => {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
        });
        document.getElementById('to-login').addEventListener('click', () => {
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });

        // Game Controls
        document.getElementById('start-btn').addEventListener('click', () => {
            this.sound.playClick();
            this.startGame();
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.sound.playClick();
            this.startGame();
        });
        document.getElementById('return-home-btn').addEventListener('click', () => {
            this.sound.playClick();
            this.ui.showScreen('start');
        });
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Choices
        ['choice-a', 'choice-b'].forEach(id => {
            const btn = document.getElementById(id);
            btn.addEventListener('mouseenter', () => this.sound.playHover());
            btn.addEventListener('click', () => {
                this.sound.playClick();
                this.handleChoice(id === 'choice-a' ? 'a' : 'b');
            });
        });

        // Hover effects
        const btns = document.querySelectorAll('button');
        btns.forEach(b => b.addEventListener('mouseenter', () => this.sound.playHover()));

        // Leaderboard
        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.leaderboard.render('leaderboard-list');
            this.ui.toggleLeaderboard(true);
        });
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            this.ui.toggleLeaderboard(false);
        });

        // LEFT SIDE PANELS: Scanner and Recovery (mutually exclusive)
        const scanBtn = document.getElementById('scan-btn');
        const scannerOverlay = document.getElementById('scanner-overlay');
        if (scanBtn && scannerOverlay) {
            scanBtn.addEventListener('click', () => {
                // Close other LEFT panel
                const recoveryOverlay = document.getElementById('recovery-overlay');
                if (recoveryOverlay) recoveryOverlay.classList.add('hidden');
                document.getElementById('recovery-btn')?.classList.remove('active');

                scannerOverlay.classList.toggle('hidden');
                scanBtn.classList.toggle('active');
                this.sound.playClick();
            });
        }

        const recoveryBtn = document.getElementById('recovery-btn');
        const recoveryOverlay = document.getElementById('recovery-overlay');
        if (recoveryBtn && recoveryOverlay) {
            recoveryBtn.addEventListener('click', () => {
                // Close other LEFT panel
                const scannerOverlay = document.getElementById('scanner-overlay');
                if (scannerOverlay) scannerOverlay.classList.add('hidden');
                document.getElementById('scan-btn')?.classList.remove('active');

                recoveryOverlay.classList.toggle('hidden');
                recoveryBtn.classList.toggle('active');
                this.sound.playClick();
            });
        }

        // RIGHT SIDE PANELS: Crisis (no mutual exclusivity needed for now)
        const crisisBtn = document.getElementById('crisis-btn');
        const crisisOverlay = document.getElementById('crisis-overlay');
        if (crisisBtn && crisisOverlay) {
            crisisBtn.addEventListener('click', () => {
                crisisOverlay.classList.toggle('hidden');
                crisisBtn.classList.toggle('active');
                this.sound.playClick();
            });
        }
    }

    checkAuth() {
        const user = this.auth.currentUser;
        if (user) {
            this.onLoginSuccess(user);
        } else {
            this.ui.showScreen('auth');
        }
    }

    onLoginSuccess(user) {
        this.ui.setUser(user);
        this.ui.showScreen('start');
        // Start ambient music on start screen
        this.sound.startAmbient();
    }

    logout() {
        this.auth.logout();
        this.sound.stopAmbient();
        this.ui.showScreen('auth');
    }

    startGame() {
        this.engine.reset();
        this.visualizer.reset();

        // Reset city state (clear fires, particles)
        if (this.ui.cityRenderer) {
            this.ui.cityRenderer.resetCityState();
        }

        this.ui.updateMetrics(this.engine.getMetrics());
        this.ui.updateYear(this.engine.getYear());
        // Dynamic background updates automatically via updateMetrics listeners
        this.ui.showScreen('game');
        this.isGameActive = true;
        this.nextTurn();
    }

    nextTurn() {
        if (!this.isGameActive) return;

        // Check status
        const status = this.engine.checkStatus();
        if (status.status === 'GAMEOVER') {
            this.endGame(status.reason);
            return;
        }

        if (status.status === 'DRIFT_EVENT') {
            this.sound.playAlarm();
            this.currentCard = status.event; // Event has same structure as card

            // Check for Visual Event (DRIFT)
            if (this.currentCard.visualEvent && this.ui.cityRenderer) {
                console.log('!!! TRIGGERING DRIFT VISUAL EVENT:', this.currentCard.visualEvent);
                this.sound.playAlarm();
                this.ui.cityRenderer.setEvent(this.currentCard.visualEvent);
            }

            // Force UI update for event
            this.ui.presentCard(this.currentCard, this.engine.getMetrics());
            return;
        }

        // Get new card
        this.currentCard = this.engine.getNextCard();

        // Check for Visual Event
        if (this.currentCard.visualEvent && this.ui.cityRenderer) {
            console.log('!!! TRIGGERING VISUAL EVENT:', this.currentCard.visualEvent);
            this.sound.playAlarm(); // Major warning sound
            this.ui.cityRenderer.setEvent(this.currentCard.visualEvent);
        } else {
            console.log('No visual event for card:', this.currentCard.id);
        }

        this.ui.presentCard(this.currentCard, this.engine.getMetrics());
    }

    handleChoice(choiceType) {
        if (!this.isGameActive || !this.currentCard) return;

        const choice = choiceType === 'a' ? this.currentCard.choiceA : this.currentCard.choiceB;

        // Apply logic
        const newMetrics = this.engine.applyDecision(choice);

        // Update UI
        this.ui.updateMetrics(newMetrics);
        this.ui.updateYear(this.engine.getYear());

        // Update Audioscape
        this.sound.update(newMetrics);

        // Simulate turn-based city changes (Fire spreading/fading) AFTER metrics update
        if (this.ui.cityRenderer) {
            this.ui.cityRenderer.advanceTurn();
        }

        // Clear visual event
        if (this.ui.cityRenderer) {
            this.ui.cityRenderer.clearEvent();
        }

        // Visualize
        this.visualizer.branch(choiceType);

        // Next
        setTimeout(() => this.nextTurn(), 600); // Small delay for animation
    }

    endGame(reason) {
        this.isGameActive = false;
        const stats = {
            year: this.engine.getYear(),
            metrics: this.engine.getMetrics()
        };

        const finalScore = this.ui.showGameOver(stats, reason);
        this.auth.updateStats(finalScore);
    }
}

// How to Play Overlay
window.addEventListener('DOMContentLoaded', () => {
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const howToPlayOverlay = document.getElementById('how-to-play-overlay');
    const closeHowToPlay = document.getElementById('close-how-to-play');

    if (howToPlayBtn && howToPlayOverlay && closeHowToPlay) {
        howToPlayBtn.addEventListener('click', () => {
            howToPlayOverlay.classList.remove('hidden');
        });

        closeHowToPlay.addEventListener('click', () => {
            howToPlayOverlay.classList.add('hidden');
        });

        // Close on overlay background click
        howToPlayOverlay.addEventListener('click', (e) => {
            if (e.target === howToPlayOverlay) {
                howToPlayOverlay.classList.add('hidden');
            }
        });
    }
});

// Start
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
