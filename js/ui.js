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

        // Mute Button Reference
        this.muteBtn = document.getElementById('mute-btn');
        this.difficultyDisplay = document.getElementById('difficulty-display');

        // Legend Elements
        this.legendBtn = document.getElementById('legend-btn');
        this.legendOverlay = document.getElementById('legend-overlay');
        if (this.legendBtn) {
            this.legendBtn.addEventListener('click', () => {
                this.legendOverlay.classList.toggle('hidden');
            });
        }

        // Drift Prediction Elements
        this.driftBtn = document.getElementById('drift-btn');
        this.driftOverlay = document.getElementById('drift-overlay');
        this.driftBars = {
            climate: document.getElementById('bar-drift-climate'), // Scale with (100 - Environment)
            tech: document.getElementById('bar-drift-tech'),       // Scale with (100 - Trust) AND (100 - Economy) avg
            unrest: document.getElementById('bar-drift-unrest'),   // Scale with (100 - Stability)
            theocracy: document.getElementById('bar-drift-theocracy') // Scale with (Economy + (100-Trust)) / 2
        };

        // EXCLUSIVE OVERLAY MANAGEMENT
        this.overlayMap = [
            { id: 'scan-btn', overlayId: 'scanner-overlay' },
            { id: 'recovery-btn', overlayId: 'recovery-overlay' },
            { id: 'crisis-btn', overlayId: 'crisis-overlay' },
            { id: 'drift-btn', overlayId: 'drift-overlay' }
        ];

        // Attach centralized listeners with delay to ensure DOM is ready
        setTimeout(() => {
            this.overlayMap.forEach(item => {
                const btn = document.getElementById(item.id);
                const overlay = document.getElementById(item.overlayId);

                if (btn && overlay) {
                    btn.onclick = (e) => {
                        e.preventDefault(); // Prevent default behavior
                        e.stopPropagation(); // Stop bubbling
                        this.toggleOverlay(btn, overlay);
                    };
                }
            });
        }, 100);



        // Close all when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-btn') && !e.target.closest('.scanner-content')) {
                this.closeAllOverlays();
            }
        });

        this.currentYear = 2030;
    }

    toggleOverlay(targetBtn, targetOverlay) {
        const isClosed = targetOverlay.classList.contains('hidden');
        this.closeAllOverlays();

        if (isClosed) {
            targetOverlay.classList.remove('hidden');
            targetBtn.classList.add('active');
            if (this.screens.auth) this.screens.auth.classList.add('hidden');
        }

        // Play click sound if sound manager is injected
        if (this.sound) this.sound.playClick();
    }

    closeAllOverlays() {
        this.overlayMap.forEach(item => {
            const overlay = document.getElementById(item.overlayId);
            const btn = document.getElementById(item.id);
            if (overlay) overlay.classList.add('hidden');
            if (btn) btn.classList.remove('active');
        });
        if (this.legendOverlay) this.legendOverlay.classList.add('hidden');
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

        // Update hidden risk monitors
        this.updateDriftStats(metrics);

        // Update City Renderer state
        if (this.cityRenderer) {
            this.cityRenderer.setMetrics({
                stability: metrics.stability,
                economy: metrics.economy,
                environment: metrics.environment,
                trust: metrics.trust
            });
        }

        // Update previous
        this.previousMetrics = { ...metrics };
    }

    updateDriftStats(metrics) {
        // HIDDEN LOGIC EXPOSED via "Reality Monitor"
        // Chronal Instability (Time/Climate) -> Inverse of Environment
        // Neural Dissociation (Tech/Hallucination) -> Inverse of Trust & Economy
        // Memetic Corruption (Unrest/Amnesia) -> Inverse of Stability

        // Lazy init/Repair if missing
        if (!this.driftBars || !this.driftBars.climate) {
            console.warn("Drift bars missing, attempting to re-bind...");
            this.driftBars = {
                climate: document.getElementById('bar-drift-climate'),
                tech: document.getElementById('bar-drift-tech'),
                unrest: document.getElementById('bar-drift-unrest'),
                theocracy: document.getElementById('bar-drift-theocracy')
            };
        }

        if (!this.driftBars.climate) {
            console.error("Drift bars could not be found in DOM.");
            return;
        }

        const riskClimate = Math.max(0, 100 - metrics.environment);
        const riskTech = Math.max(0, 100 - ((metrics.trust + metrics.economy) / 2));
        const riskUnrest = Math.max(0, 100 - metrics.stability);
        // Theocracy Risk: Average of High Economy and Low Trust
        const riskTheocracy = Math.max(0, (metrics.economy + (100 - metrics.trust)) / 2);

        // Update Bars
        if (this.driftBars.climate) this.driftBars.climate.style.width = `${riskClimate}%`;
        if (this.driftBars.tech) this.driftBars.tech.style.width = `${riskTech}%`;
        if (this.driftBars.unrest) this.driftBars.unrest.style.width = `${riskUnrest}%`;
        if (this.driftBars.theocracy) this.driftBars.theocracy.style.width = `${riskTheocracy}%`;

        // Color Coding (Purple -> Red)
        const updateColor = (bar, val) => {
            if (!bar) return;
            if (val > 45) {
                bar.style.backgroundColor = 'var(--alert-red)';
                bar.style.boxShadow = '0 0 10px var(--alert-red)';
            } else {
                bar.style.backgroundColor = 'var(--neon-purple)';
                bar.style.boxShadow = '0 0 5px var(--neon-purple)';
            }
        };

        updateColor(this.driftBars.climate, riskClimate);
        updateColor(this.driftBars.tech, riskTech);
        updateColor(this.driftBars.unrest, riskUnrest);
        updateColor(this.driftBars.theocracy, riskTheocracy);
    }



    updateYear(year) {
        this.yearDisplay.innerText = year;
        this.currentYear = year;

        // Update Difficulty Display
        const multiplier = this.getDifficultyMultiplier(year);
        if (this.difficultyDisplay) {
            this.difficultyDisplay.innerText = `RISK: ${multiplier.toFixed(1)}x`;

            // Color coding for risk
            if (multiplier >= 2.0) this.difficultyDisplay.style.color = 'var(--alert-red)';
            else if (multiplier >= 1.7) this.difficultyDisplay.style.color = 'var(--warning-yellow)';
            else this.difficultyDisplay.style.color = 'var(--primary-cyan)';
        }

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

        // --- THEME & VISUALIZATION ---
        // Reset themes
        this.cardElement.className = 'card entrance';
        const existingBadge = this.cardElement.querySelector('.type-badge');
        if (existingBadge) existingBadge.remove();

        let typeLabel = "NORMAL";
        let themeClass = "";

        // Determine Theme based on tags or impact
        if (card.tags && card.tags.includes('crisis')) {
            themeClass = 'crisis';
            typeLabel = "⚠️ CRISIS";
        } else if (card.tags && card.tags.includes('drift')) {
            themeClass = 'drift';
            typeLabel = "🌌 DRIFT";
        } else if (card.tags && card.tags.includes('recovery')) {
            themeClass = 'recovery';
            typeLabel = "❤️‍🩹 RECOVERY";
        }

        if (themeClass) {
            this.cardElement.classList.add(themeClass);

            // Inject Badge
            const badge = document.createElement('div');
            badge.className = 'type-badge';
            badge.innerText = typeLabel;
            this.cardElement.appendChild(badge);
        }

        // --- SPECIAL VISUAL EFFECTS ---
        // Clean up old effects
        this.cardElement.classList.remove('card-effect-sepia', 'card-effect-glitch', 'card-effect-blur', 'card-effect-holy');

        if (card.id === 'drift_chronal') {
            this.cardElement.classList.add('card-effect-sepia');
        } else if (card.id === 'drift_hallucination') {
            this.cardElement.classList.add('card-effect-glitch');
        } else if (card.id === 'drift_amnesia') {
            this.cardElement.classList.add('card-effect-blur');
        } else if (card.id === 'drift_theocracy') {
            this.cardElement.classList.add('card-effect-holy');
        } else if (card.id === 'event_glitch') {
            this.cardElement.classList.add('card-effect-severe-glitch');
        }

        // Note: Background is now fully dynamic and independent of individual cards.
        // It driven solely by global metrics, which are updated separately.

        // Update buttons
        // Update buttons
        this.btnChoiceA.innerHTML = `<strong>${card.choiceA.label}</strong> ${card.choiceA.text}`;
        this.btnChoiceB.innerHTML = `<strong>${card.choiceB.label}</strong> ${card.choiceB.text}`;
    }

    getDifficultyMultiplier(year) {
        // Match logic from engine.js
        const turnsPlayed = year - 2030;
        // Start 1.0x, +0.1 every 2 years, Cap 2.0x at 2050
        const penaltyMultiplier = 1.0 + Math.min(1.0, Math.floor(turnsPlayed / 2) * 0.1);
        return penaltyMultiplier;
    }

    showGameOver(stats, reason) {
        this.showScreen('gameOver');
        // City continues running in background
        document.getElementById('end-title').innerText = 'TIMELINE COLLAPSED';
        document.getElementById('cause-effect-summary').innerText = reason;

        let html = `
            <div class="stat-row"><span>Years Survived:</span> <span>${stats.year - 2030}</span></div>
            <div class="stat-row"><span>Final Score:</span> <span>${this.calculateScore(stats)}</span></div>
        `;
        document.getElementById('final-stats').innerHTML = html;

        return this.calculateScore(stats);
    }

    calculateScore(stats) {
        // Simple score: Years * avg metrics
        const avg = (stats.metrics.stability + stats.metrics.economy + stats.metrics.environment + stats.metrics.trust) / 4;
        return Math.floor((stats.year - 2030) * 100 + avg * 10);
    }

    toggleLeaderboard(show) {
        if (show) this.screens.leaderboard.classList.remove('hidden');
        else this.screens.leaderboard.classList.add('hidden');
    }
}
