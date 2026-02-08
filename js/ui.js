class UIManager {
    constructor() {
        this.screens = {
            auth: document.getElementById('auth-overlay'),
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-interface'),
            gameOver: document.getElementById('game-over-screen'),
            leaderboard: document.getElementById('leaderboard-overlay')
        };

        this.metrics = {
            stability: document.getElementById('metric-stability'),
            economy: document.getElementById('metric-economy'),
            environment: document.getElementById('metric-environment'),
            trust: document.getElementById('metric-trust')
        };

        this.yearDisplay = document.getElementById('year-count');
        this.bgLayer = document.getElementById('bg-layer');
        this.cardTitle = document.getElementById('card-title');
        this.cardDesc = document.getElementById('card-desc');
        this.cardElement = document.getElementById('current-card');

        // Buttons
        this.btnChoiceA = document.getElementById('choice-a');
        this.btnChoiceB = document.getElementById('choice-b');

        this.currentUserDisplay = document.getElementById('current-user-display');

        this.currentUserDisplay = document.getElementById('current-user-display');

        // Initialize Living City Renderer
        // Make sure to attach it to bg-layer or replace it
        const bgLayer = document.getElementById('bg-layer');
        bgLayer.innerHTML = ''; // Clear existing
        this.cityRenderer = new CityRenderer();
        bgLayer.appendChild(this.cityRenderer.canvas);

        // Mute Button Handler
        this.muteBtn = document.getElementById('mute-btn');
        this.muteBtn.addEventListener('click', () => {
            if (window.game && window.game.sound) {
                const isMuted = window.game.sound.toggleMute();
                this.updateMuteIcon(isMuted);
            }
        });

        // Initialize icon state
        // We need to wait for game.sound to be ready, or check it if available
        setTimeout(() => {
            if (window.game && window.game.sound) {
                this.updateMuteIcon(window.game.sound.isMuted);
            }
        }, 100);
    }

    updateMuteIcon(isMuted) {
        this.muteBtn.innerText = isMuted ? '🔇' : '🔊';
        this.muteBtn.classList.toggle('muted', isMuted);
    }

    showScreen(screenName) {
        // Auth is an overlay, handled separately
        if (screenName === 'auth') {
            this.screens.auth.classList.remove('hidden');
            // Hide other screens to prevent double text/overlap since auth is now transparent
            ['start', 'game', 'gameOver'].forEach(s => {
                if (this.screens[s]) this.screens[s].classList.add('hidden');
            });
            return;
        }

        // Hide overlays
        this.screens.auth.classList.add('hidden');
        this.screens.leaderboard.classList.add('hidden');

        // Hide all main screens
        ['start', 'game', 'gameOver'].forEach(s => {
            if (this.screens[s]) this.screens[s].classList.add('hidden');
        });

        // Show target
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }

        // VISUALIZER MANAGEMENT
        const viz = document.getElementById('visualizer-container');
        if (screenName === 'gameOver') {
            // Move visualizer to game over screen (before the panel)
            const screen = this.screens.gameOver;
            const panel = screen.querySelector('.glass-panel');
            screen.insertBefore(viz, panel);

            viz.classList.remove('minimized'); // Use full height defined in CSS for game over
            window.dispatchEvent(new Event('resize'));
        } else if (screenName === 'game') {
            // Move visualizer back to game interface (before decision area)
            const screen = this.screens.game;
            const decision = document.getElementById('decision-area');
            screen.insertBefore(viz, decision);

            // It will be hidden by CSS #game-interface rule
            window.dispatchEvent(new Event('resize'));
        }
    }

    updateMetrics(metrics) {
        // Initialize previous metrics on first call
        if (!this.previousMetrics) {
            this.previousMetrics = { ...metrics };
        }

        const map = {
            stability: this.metrics.stability,
            economy: this.metrics.economy,
            environment: this.metrics.environment,
            trust: this.metrics.trust
        };

        const isFirstCall = (this.previousMetrics.stability === metrics.stability &&
            this.previousMetrics.economy === metrics.economy &&
            this.previousMetrics.environment === metrics.environment &&
            this.previousMetrics.trust === metrics.trust);

        for (const [key, el] of Object.entries(map)) {
            if (metrics[key] === undefined) continue;

            const currentVal = Math.round(metrics[key]);
            const prevVal = Math.round(this.previousMetrics[key]);

            const fill = el.querySelector('.bar-fill');

            // Update the text value immediately
            el.querySelector('.value').innerText = `${currentVal}%`;

            if (isFirstCall) {
                // First call - instant update
                fill.style.transition = 'none';
                fill.style.width = `${currentVal}%`;

                // Color code the bar
                if (currentVal < 30) fill.style.backgroundColor = 'var(--alert-red)';
                else if (currentVal > 70) fill.style.backgroundColor = 'var(--success-green)';
                else fill.style.backgroundColor = 'var(--primary-cyan)';
            } else {
                // Animate the change
                fill.style.transition = 'width 2s ease-out, background-color 2s ease';
                fill.style.width = `${currentVal}%`;

                // Color code based on final value
                if (currentVal < 30) fill.style.backgroundColor = 'var(--alert-red)';
                else if (currentVal > 70) fill.style.backgroundColor = 'var(--success-green)';
                else fill.style.backgroundColor = 'var(--primary-cyan)';
            }
        }

        // Store current as previous for next update
        this.previousMetrics = { ...metrics };

        // Update City Renderer state
        if (this.cityRenderer) {
            this.cityRenderer.setMetrics({
                stability: metrics.stability,
                economy: metrics.economy,
                environment: metrics.environment,
                trust: metrics.trust
            });
        }
    }

    updateYear(year) {
        this.yearDisplay.innerText = year;

        // Update city renderer for tech progression
        if (this.cityRenderer) {
            this.cityRenderer.setYear(year);
        }
    }

    setUser(user) {
        if (user) {
            this.currentUserDisplay.innerText = user.username;
        } else {
            this.currentUserDisplay.innerText = 'Guest';
        }
    }

    presentCard(card, metrics) {
        // Animation reset
        this.cardElement.classList.remove('entrance');
        void this.cardElement.offsetWidth; // trigger reflow
        this.cardElement.classList.add('entrance');

        this.cardTitle.innerText = card.title;
        this.cardDesc.innerText = card.description;

        // Note: Background is now fully dynamic and independent of individual cards.
        // It driven solely by global metrics, which are updated separately.

        // Update buttons
        this.btnChoiceA.innerHTML = `<strong>${card.choiceA.label}</strong> ${card.choiceA.text}`;
        this.btnChoiceB.innerHTML = `<strong>${card.choiceB.label}</strong> ${card.choiceB.text}`;
    }

    showGameOver(stats, reason) {
        this.showScreen('gameOver');
        // City continues running in background
        document.getElementById('end-title').innerText = 'TIMELINE COLLAPSED';
        document.getElementById('cause-effect-summary').innerText = reason;

        let html = `
            <div class="stat-row"><span>Years Survived:</span> <span>${stats.year - 2024}</span></div>
            <div class="stat-row"><span>Final Score:</span> <span>${this.calculateScore(stats)}</span></div>
        `;
        document.getElementById('final-stats').innerHTML = html;

        return this.calculateScore(stats);
    }

    calculateScore(stats) {
        // Simple score: Years * avg metrics
        const avg = (stats.metrics.stability + stats.metrics.economy + stats.metrics.environment + stats.metrics.trust) / 4;
        return Math.floor((stats.year - 2024) * 100 + avg * 10);
    }

    toggleLeaderboard(show) {
        if (show) this.screens.leaderboard.classList.remove('hidden');
        else this.screens.leaderboard.classList.add('hidden');
    }
}
