class GameEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // Deep copy initial state
        this.gameState = JSON.parse(JSON.stringify(GameData.initialState));
        this.history = []; // Track decisions
        this.lastTurnWasCrisis = false; // Prevent back-to-back disasters
        this.eventCooldowns = {}; // Track cooldowns for specific events
    }

    // Apply the impact of a choice
    applyDecision(choice) {
        const { impact, weightMod } = choice;

        // Update visible metrics
        for (const [key, value] of Object.entries(impact)) {
            if (this.gameState.metrics[key] !== undefined) {
                // PROGRESSIVE DIFFICULTY: Penalties increase smoothly as turns go on
                // Year 2030 (start): 1.4x penalty
                // Year 2050 (turn 20): 2.0x penalty
                // Linear progression: +0.03x per turn
                let val = value;

                if (val < 0) {
                    const turnsPlayed = this.gameState.year - 2030;
                    // Smooth linear scaling from 1.4x to 2.0x over 20 turns
                    const penaltyMultiplier = 1.4 + Math.min(0.6, turnsPlayed * 0.03);
                    val = Math.floor(val * penaltyMultiplier);
                }

                this.gameState.metrics[key] += val;

                // Clamp between 0 and 100
                this.gameState.metrics[key] = Math.max(0, Math.min(100, this.gameState.metrics[key]));
            }
        }

        // Update hidden weights
        if (weightMod) {
            for (const [key, value] of Object.entries(weightMod)) {
                if (this.gameState.hiddenWeights[key] !== undefined) {
                    this.gameState.hiddenWeights[key] += value;
                    // Clamp
                    this.gameState.hiddenWeights[key] = Math.max(0, this.gameState.hiddenWeights[key]);
                }
            }
        }


        this.gameState.year += 1;

        // Decrement cooldowns
        for (const id in this.eventCooldowns) {
            if (this.eventCooldowns[id] > 0) this.eventCooldowns[id]--;
        }

        return this.gameState.metrics;
    }

    // Check if the game should end or if a drift event occurs
    checkStatus() {
        // Check for Game Over conditions (metrics hitting 0)
        for (const [key, value] of Object.entries(this.gameState.metrics)) {
            if (value <= 0) {
                return { status: 'GAMEOVER', reason: `Critical Failure: ${key.toUpperCase()} collapsed.` };
            }
        }

        // Check for drift events (Conditions based on metrics OR hidden weights)
        // PREVENT CONSECUTIVE CRISIS: If last turn was a crisis, force a normal card this turn.
        if (this.lastTurnWasCrisis) {
            return { status: 'CONTINUE' };
        }

        for (const event of GameData.driftEvents) {
            // Check specific cooldown
            if (this.eventCooldowns[event.id] > 0) continue;

            let triggered = false;

            // 1. Check Hidden Weights (Old System)
            if (event.trigger && event.threshold) {
                if (this.gameState.hiddenWeights[event.trigger] >= event.threshold) {
                    triggered = true;
                }
            }

            // 2. Check Metric Conditions (New System)
            if (event.conditions) {
                let allMet = true;
                for (const [metric, constraints] of Object.entries(event.conditions)) {
                    const currentVal = this.gameState.metrics[metric];
                    if (constraints.min !== undefined && currentVal < constraints.min) allMet = false;
                    if (constraints.max !== undefined && currentVal > constraints.max) allMet = false;
                }
                if (allMet) triggered = true;
            }

            if (triggered) {
                // 30% chance to trigger per turn if conditions met
                // prioritizing unlikely events
                if (Math.random() < 0.3) {
                    this.lastTurnWasCrisis = true;
                    // Set cooldown (prevent spamming same event)
                    this.eventCooldowns[event.id] = 8;
                    return { status: 'DRIFT_EVENT', event: event };
                }
            }
        }

        return { status: 'CONTINUE' };
    }

    getMetrics() {
        return this.gameState.metrics;
    }

    getYear() {
        return this.gameState.year;
    }

    // Get a random card that hasn't been played much (naive implementation)
    getNextCard() {
        this.lastTurnWasCrisis = false; // Reset crisis flag when normal card is drawn
        const pool = GameData.decisionPool;
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    }
}
