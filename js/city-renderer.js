/**
 * Living City Engine
 * World-State-Driven Animated Background
 * Matches the pixel-art reference: Sunset skyline with water reflections.
 */
class CityRenderer {
    constructor(canvasId) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = canvasId || 'city-canvas';
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // Pixel-art canvas settings (UPSCALED for detail)
        this.renderWidth = 640;
        this.renderHeight = 360;
        this.canvas.width = this.renderWidth;
        this.canvas.height = this.renderHeight;
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // Game Metrics -> World Status
        this.metrics = { stability: 60, economy: 60, environment: 60, trust: 60 };
        this.targetMetrics = { ...this.metrics };
        this.worldStatus = 60; // The single driver (0-100)
        this.targetWorldStatus = 60;

        // Time
        this.time = 0;
        this.lastTime = 0;

        // Layers: Far, Mid, Near (silhouettes)
        this.layers = { far: [], mid: [], near: [] };

        // Dynamic Elements
        this.cars = [];
        this.particles = []; // Smoke, Fire, Rain
        this.stars = [];
        this.flyingCars = []; // Flying vehicles (appear in later years)
        this.drones = []; // Surveillance/delivery drones

        // Billboard
        this.billboard = { x: 0, y: 0, w: 0, h: 0 };

        // Visual Events (Crisis)
        this.currentEvent = null; // 'blackout', 'acid_rain', 'glitch', 'heatwave'
        this.eventTimer = 0;

        // Game year for tech progression
        this.currentYear = 2030;

        this.initCity();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // --- EVENT SYSTEM ---
    setEvent(type) {
        console.log('CityRenderer: SET EVENT', type);
        this.currentEvent = type;
        this.eventTimer = 0;
    }

    clearEvent() {
        console.log('CityRenderer: CLEAR EVENT');
        this.currentEvent = null;
    }

    // --- INITIALIZATION ---
    initCity() {
        this.layers = { far: [], mid: [], near: [] };
        this.cars = [];
        this.particles = [];

        const horizonY = this.renderHeight * 0.55; // Water line

        // Stars
        this.stars = [];
        for (let i = 0; i < 30; i++) {
            this.stars.push({ x: Math.random() * this.renderWidth, y: Math.random() * horizonY * 0.4, size: Math.random() > 0.9 ? 2 : 1 });
        }

        // --- LAYER 1: FAR (Faint, purple silhouettes) ---
        let x = 0;
        while (x < this.renderWidth) {
            const w = 15 + Math.random() * 25;
            const h = 30 + Math.random() * 50;
            this.layers.far.push({ x, w, h, y: horizonY });
            x += w - 2;
        }

        // --- LAYER 2: MID (Darker purple, more detail) ---
        x = -10;
        while (x < this.renderWidth) {
            const w = 20 + Math.random() * 35;
            const h = 50 + Math.random() * 60;
            const b = { x, w, h, y: horizonY, windows: [], isOnFire: false, fireIntensity: 0, maxFireIntensity: 0 };

            // Simple window grid
            for (let wy = 10; wy < h - 10; wy += 8) {
                for (let wx = 4; wx < w - 4; wx += 6) {
                    if (Math.random() > 0.2) {
                        b.windows.push({ x: wx, y: wy, w: 3, h: 4, flickerOffset: Math.random() * 100 });
                    }
                }
            }
            this.layers.mid.push(b);
            x += w - 3;
        }

        // --- LAYER 3: NEAR (Darkest, foreground) ---
        x = 0;
        while (x < this.renderWidth) {
            const w = 25 + Math.random() * 40;
            const h = 60 + Math.random() * 80;
            const b = { x, w, h, y: horizonY, windows: [], isOnFire: false, hasBillboard: false, fireIntensity: 0, maxFireIntensity: 0 };

            // Denser window grid
            for (let wy = 12; wy < h - 15; wy += 10) {
                for (let wx = 5; wx < w - 5; wx += 7) {
                    if (Math.random() > 0.15) {
                        b.windows.push({ x: wx, y: wy, w: 4, h: 5, flickerOffset: Math.random() * 100 });
                    }
                }
            }

            // Pick one building for the billboard
            if (!this.billboard.assigned && x > this.renderWidth * 0.3 && x < this.renderWidth * 0.6 && h > 80) {
                b.hasBillboard = true;
                this.billboard = { x: b.x + 3, y: horizonY - h - 18, w: b.w - 6, h: 14, assigned: true };
            }

            this.layers.near.push(b);
            x += w + 2;
        }
    }

    // --- METRIC INTERFACE ---
    setMetrics(newMetrics) {
        if (newMetrics) {
            this.targetMetrics = { ...newMetrics };
            this.targetWorldStatus = (newMetrics.stability + newMetrics.economy + newMetrics.environment + newMetrics.trust) / 4;

            // Update fires immediately when metrics change
            this.advanceTurn();
        }
    }

    setYear(year) {
        this.currentYear = year;
    }

    // Reset city state (fires, etc) when game restarts
    resetCityState() {
        // Clear all fires
        [...this.layers.near, ...this.layers.mid, ...this.layers.far].forEach(b => {
            b.isOnFire = false;
        });
        // Clear particles
        this.particles = [];
    }

    // --- TURN BASED UPDATES ---
    advanceTurn() {
        // Use targetMetrics for immediate response (not lerped metrics)
        const stability = this.targetMetrics.stability;
        let targetFireCount = 0;

        // Stability Threshold Logic
        if (stability > 40) {
            targetFireCount = 0;
        } else if (stability > 30) {
            targetFireCount = 1 + Math.floor(Math.random() * 2); // 1-2
        } else if (stability > 20) {
            targetFireCount = 3 + Math.floor(Math.random() * 2); // 3-4
        } else if (stability > 10) {
            targetFireCount = 4 + Math.floor(Math.random() * 2); // 4-5
        } else {
            // Massive Fire (< 10%)
            // Count all buildings minus 1 or 2 survivors
            const totalBuildings = this.layers.mid.length + this.layers.near.length;
            targetFireCount = Math.max(0, totalBuildings - (1 + Math.floor(Math.random() * 2)));
        }

        // Collect all flammable buildings
        const allBuildings = [...this.layers.mid, ...this.layers.near];

        // Count current fires
        let currentFires = allBuildings.filter(b => b.isOnFire);

        // Adjust to match target
        if (currentFires.length < targetFireCount) {
            // Ignite more
            let needed = targetFireCount - currentFires.length;
            const available = allBuildings.filter(b => !b.isOnFire);

            // Shuffle available
            for (let i = available.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [available[i], available[j]] = [available[j], available[i]];
            }

            // CRITICAL: Ensure Main Building burns if stability is low (< 40)
            // User requested "possibility of burn in low percent [high stability]" too.
            // If stability < 40, we force main building to be a candidate with high priority.
            if (this.targetMetrics.stability < 40) {
                const mainBuilding = available.find(b => b.hasBillboard);
                if (mainBuilding) {
                    // Move it to the front
                    available.splice(available.indexOf(mainBuilding), 1);
                    available.unshift(mainBuilding);
                }
            }

            for (let i = 0; i < needed && i < available.length; i++) {
                available[i].isOnFire = true;
                available[i].fireIntensity = 0.1; // Start small
                available[i].maxFireIntensity = 0.5 + Math.random() * 0.5; // Random max intensity
            }
        } else if (currentFires.length > targetFireCount) {
            // Extinguish some (prioritize keeping those with high intensity? No, random is fair)
            let toRemove = currentFires.length - targetFireCount;

            // Shuffle current fires
            for (let i = currentFires.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentFires[i], currentFires[j]] = [currentFires[j], currentFires[i]];
            }

            for (let i = 0; i < toRemove; i++) {
                currentFires[i].isOnFire = false;
            }
        }
    }

    // --- FLYING VEHICLES SYSTEM ---
    updateFlyingVehicles(dt) {
        const economy = this.metrics.economy;
        const trust = this.metrics.trust;
        const year = this.currentYear;

        // Flying Cars - Progressive appearance based on year
        let maxFlyingCars = 0;
        if (year >= 2050) maxFlyingCars = 8;
        else if (year >= 2045) maxFlyingCars = 6;
        else if (year >= 2040) maxFlyingCars = 4;
        else if (year >= 2035) maxFlyingCars = 2;

        // Economy bonus
        if (economy > 70) maxFlyingCars += 2;

        // Spawn flying cars
        if (this.flyingCars.length < maxFlyingCars && Math.random() < 0.02) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            const colors = ['#00f3ff', '#ff00ff', '#ffff00', '#ffffff'];
            this.flyingCars.push({
                x: dir === 1 ? -40 : this.renderWidth + 40,
                y: 80 + Math.random() * 120, // Sky height
                vx: dir * (30 + Math.random() * 40),
                vy: Math.sin(this.time) * 2, // Slight bobbing
                color: colors[Math.floor(Math.random() * colors.length)],
                width: 12,
                height: 4,
                phase: Math.random() * Math.PI * 2 // For bobbing animation
            });
        }

        // Update flying cars
        this.flyingCars.forEach(fc => {
            fc.x += fc.vx * dt;
            fc.y += Math.sin(this.time * 2 + fc.phase) * 0.5; // Bobbing motion
        });
        this.flyingCars = this.flyingCars.filter(fc => fc.x > -60 && fc.x < this.renderWidth + 60);

        // Drones - Based on economy and trust
        let maxDrones = Math.floor(economy / 20); // 0-5 drones
        if (trust < 40) maxDrones += 3; // Surveillance drones

        // Spawn drones
        if (this.drones.length < maxDrones && Math.random() < 0.015) {
            const isSurveillance = trust < 40 && Math.random() > 0.5;
            this.drones.push({
                x: Math.random() * this.renderWidth,
                y: 100 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                targetX: Math.random() * this.renderWidth,
                targetY: 100 + Math.random() * 150,
                color: isSurveillance ? '#ff0000' : '#00ff88',
                size: 3,
                blinkPhase: Math.random() * Math.PI * 2,
                type: isSurveillance ? 'surveillance' : 'delivery'
            });
        }

        // Update drones (move toward target, then pick new target)
        this.drones.forEach(d => {
            const dx = d.targetX - d.x;
            const dy = d.targetY - d.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                // Pick new target
                d.targetX = Math.random() * this.renderWidth;
                d.targetY = 100 + Math.random() * 150;
            } else {
                // Move toward target
                d.vx += (dx / dist) * 50 * dt;
                d.vy += (dy / dist) * 50 * dt;
            }

            // Apply velocity with damping
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.vx *= 0.95;
            d.vy *= 0.95;

            d.blinkPhase += dt * 5;
        });
        this.drones = this.drones.filter(d => d.x > -20 && d.x < this.renderWidth + 20);
    }

    // --- UPDATE LOOP ---
    update(dt) {
        this.time += dt;

        // Lerp metrics
        for (let key in this.metrics) {
            this.metrics[key] += (this.targetMetrics[key] - this.metrics[key]) * 0.05;
        }
        this.worldStatus += (this.targetWorldStatus - this.worldStatus) * 0.03;

        // --- ADAPTIVE SYSTEMS ---
        const status = this.worldStatus;

        // 1. Traffic
        const trust = this.metrics.trust;
        const economy = this.metrics.economy;

        // Traffic scales with Economy (0.01 to 0.05 chance)
        const trafficChance = 0.01 + (economy / 100) * 0.04;

        if (Math.random() < trafficChance) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            // Police only if low trust
            const isPolice = trust < 40 && Math.random() > 0.7;

            this.cars.push({
                x: dir === 1 ? -30 : this.renderWidth + 30,
                y: this.renderHeight * 0.54 + Math.random() * 4,
                vx: dir * (isPolice ? (40 + Math.random() * 20) : (10 + Math.random() * 20)),
                color: isPolice ? '#111144' : (Math.random() > 0.5 ? '#556' : '#446'),
                type: isPolice ? 'police' : 'civilian',
                width: 10
            });
        }

        // 1b. FIRE ENGINES
        // Check if there is a fire
        const burningBuildings = [...this.layers.near, ...this.layers.mid].filter(b => b.isOnFire).length;
        // Spawn chance scales with fire severity
        // 1 building: 0.15% chance (1 in 666 frames ~ 11s)
        // 10 buildings: 1.5% chance (1 in 66 frames ~ 1s)
        const currentEngines = this.cars.filter(c => c.type === 'fire_engine').length;
        const maxEngines = Math.min(3, burningBuildings); // Max 3 or equal to fires

        // Spawn chance: 0.5% per burning building (very low)
        const fireChance = 0.005 * burningBuildings;

        if (burningBuildings > 0 && currentEngines < maxEngines && Math.random() < fireChance) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            this.cars.push({
                x: dir === 1 ? -60 : this.renderWidth + 60,
                y: this.renderHeight * 0.54 + Math.random() * 4,
                vx: dir * (50 + Math.random() * 20), // Faster (50-70)
                color: '#cc0000',
                type: 'fire_engine',
                width: 18 // Longer
            });
        }

        this.cars.forEach(c => c.x += c.vx * dt);
        this.cars = this.cars.filter(c => c.x > -60 && c.x < this.renderWidth + 60);

        // 2. Fire Logic & Particles
        [...this.layers.near, ...this.layers.mid].forEach(b => {
            if (b.isOnFire) {
                // Ramp up intensity
                if (b.fireIntensity < b.maxFireIntensity) {
                    b.fireIntensity += dt * 0.1;
                }

                // Fluctuate intensity
                const flicker = Math.sin(this.time * 10 + b.x) * 0.1;
                const currentIntensity = Math.min(1.0, Math.max(0.1, b.fireIntensity + flicker));

                // --- PARTICLES ---

                // Fire (Clumped, rising)
                // Rate depends on intensity
                if (Math.random() < 0.2 * currentIntensity) {
                    this.particles.push({
                        x: b.x + Math.random() * b.w,
                        y: b.y - b.h + Math.random() * 10, // Mostly on roof/top
                        vx: (Math.random() - 0.5) * 5,
                        vy: -40 - Math.random() * 30 * currentIntensity, // Upward velocity
                        life: 1.0,
                        maxLife: 0.8 + Math.random() * 0.5,
                        type: 'fire',
                        size: (2 + Math.random() * 4) * currentIntensity
                    });
                }

                // Smoke (Volumetric, Wind)
                // More smoke at higher intensity
                if (Math.random() < 0.15 * currentIntensity) {
                    this.particles.push({
                        x: b.x + Math.random() * b.w,
                        y: b.y - b.h,
                        vx: (Math.random() - 0.2) * 20 + 15, // Wind drift right
                        vy: -15 - Math.random() * 20,
                        life: 2.0,
                        maxLife: 2.0 + Math.random() * 1.5,
                        type: 'smoke',
                        size: (5 + Math.random() * 6) * currentIntensity
                    });
                }
            } else {
                // Decay intensity if not on fire
                if (b.fireIntensity > 0) {
                    b.fireIntensity -= dt * 0.5;
                    // Smoking rubble
                    if (Math.random() < 0.05) {
                        this.particles.push({
                            x: b.x + Math.random() * b.w,
                            y: b.y - b.h,
                            vx: 5,
                            vy: -10,
                            life: 1.0,
                            maxLife: 1.5,
                            type: 'smoke',
                            size: 3
                        });
                    }
                }
            }
        });

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            // Shrink fire
            if (p.type === 'fire') p.size *= 0.95;
            // Grow smoke
            if (p.type === 'smoke') {
                p.size *= 1.01;
                p.vx += dt * 5; // Wind acceleration
            }
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // 3. Flying Vehicles (Progressive Tech)
        this.updateFlyingVehicles(dt);
    }

    // --- DRAW LOOP ---
    draw() {
        const horizonY = this.renderHeight * 0.55;
        const status = this.worldStatus;
        const env = this.metrics.environment;
        const trust = this.metrics.trust;

        // === 1. SKY (Gradient shifts with Environment) ===
        // Environment controls the palette cleanliness
        const grad = this.ctx.createLinearGradient(0, 0, 0, horizonY);

        if (this.currentEvent === 'heatwave') {
            // HEATWAVE OVERRIDE: Intense Orange/Red
            grad.addColorStop(0, '#ff4400');
            grad.addColorStop(0.5, '#ff8800');
            grad.addColorStop(1, '#ffff00');
        } else if (env >= 70) {
            // Clean: Pink/Gold Sunset
            grad.addColorStop(0, '#4a2c6a');
            grad.addColorStop(0.5, '#b56576');
            grad.addColorStop(1, '#eaac8b');
        } else if (env >= 40) {
            // Smoggy: Grey/Orange
            grad.addColorStop(0, '#3a3a4a');
            grad.addColorStop(0.5, '#6a5a4a');
            grad.addColorStop(1, '#a08a7a');
        } else {
            // Toxic: Green/Black
            grad.addColorStop(0, '#0a1a0a');
            grad.addColorStop(0.5, '#2a3a2a');
            grad.addColorStop(1, '#4a5a3a');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.renderWidth, horizonY);

        // === 2. STARS (Pollution Hides them) ===
        if (env > 60) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${(env - 60) / 40})`;
            this.stars.forEach(s => {
                if (Math.random() > 0.05) this.ctx.fillRect(s.x, s.y, s.size, s.size);
            });
        }

        // === SEARCHLIGHTS (Trust Driven) ===
        // More searchlights as trust falls below 80% (1 per 15%)
        const numToSpawn = Math.max(0, Math.floor((80 - trust) / 15));

        if (numToSpawn > 0) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'overlay';
            // Increased opacity and brightness for better visibility
            this.ctx.fillStyle = `rgba(220, 240, 255, 0.25)`;

            for (let i = 0; i < numToSpawn; i++) {
                const xPos = this.renderWidth * ((i + 1) / (numToSpawn + 1));
                const speed = 0.3 + (i % 3) * 0.2;
                const phase = i * 2.5;
                const angle = Math.sin(this.time * speed + phase) * 0.6; // Sweep

                this.ctx.translate(xPos, horizonY);
                this.ctx.rotate(angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(-45, -this.renderHeight * 1.5);
                this.ctx.lineTo(45, -this.renderHeight * 1.5);
                this.ctx.fill();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
            }
            this.ctx.restore();
        }

        // === 3. SUN (Dims and reddens with Env decay) ===
        const sunBrightness = Math.max(0.3, env / 100);
        const sunY = horizonY - 25;

        if (this.currentEvent === 'heatwave') {
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.beginPath();
            const pulse = Math.sin(this.time * 8) * 5;
            this.ctx.arc(this.renderWidth / 2, sunY, 60 + pulse, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = `rgba(255, ${200 * sunBrightness}, ${150 * sunBrightness}, ${0.8 + sunBrightness * 0.2})`;
            this.ctx.beginPath();
            this.ctx.arc(this.renderWidth / 2, sunY, 18, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // === 4. FAR LAYER (Silhouettes) ===
        // === 4. FAR LAYER (Silhouettes - Environment) ===
        this.ctx.fillStyle = env >= 70 ? '#6a4a6a' : (env >= 40 ? '#5a4a5a' : '#2a3a2a');
        this.layers.far.forEach(b => {
            this.ctx.fillRect(b.x, b.y - b.h, b.w, b.h);
        });

        // === 5. MID LAYER ===
        // === 5. MID LAYER ===
        this.layers.mid.forEach(b => {
            // Environment controls building color
            this.ctx.fillStyle = env >= 70 ? '#3a3a4a' : (env >= 40 ? '#2a2a3a' : '#1a1a1a');
            if (b.isOnFire) {
                const darken = Math.floor(30 * (1 - b.fireIntensity));
                this.ctx.fillStyle = `rgb(${darken}, ${darken}, ${darken})`;
            }
            this.ctx.fillRect(b.x, b.y - b.h, b.w, b.h);

            // Windows
            let litRatio = this.metrics.economy / 100;
            // BLACKOUT FIX: Mid Layer was missing this check!
            if (this.currentEvent === 'blackout') litRatio = 0;

            b.windows.forEach((w, i) => {
                // Fire Logic
                if (b.isOnFire) {
                    // Fire flicker (fast, random)
                    if (Math.random() < 0.6 * b.fireIntensity) {
                        this.ctx.fillStyle = Math.random() > 0.5 ? '#ff4400' : '#ff8800';
                    } else {
                        this.ctx.fillStyle = '#0a0a0a';
                    }
                }
                // Economy Logic
                else if (i / b.windows.length < litRatio) {
                    // Economy Flicker (Random)
                    let isFlickering = false;
                    if (this.metrics.economy < 40 && Math.random() > 0.9) {
                        isFlickering = true;
                    }

                    if (isFlickering) {
                        this.ctx.fillStyle = '#111'; // Flicker off
                    } else if (Math.random() > 0.05) { // Random color variation
                        this.ctx.fillStyle = '#eec866';
                    } else {
                        this.ctx.fillStyle = '#ccaa55'; // slight variation
                    }
                } else {
                    this.ctx.fillStyle = '#15151a';
                }
                this.ctx.fillRect(b.x + w.x, b.y - b.h + w.y, w.w, w.h);
            });
        });

        // === 6. NEAR LAYER (Foreground) ===
        this.layers.near.forEach(b => {
            this.ctx.fillStyle = env >= 70 ? '#1a1a24' : (env >= 40 ? '#10101a' : '#050508');
            if (b.isOnFire) {
                // Charred effect based on intensity
                // Higher intensity = darker/redder
                const darken = Math.floor(20 * (1 - b.fireIntensity));
                this.ctx.fillStyle = `rgb(${darken}, ${darken}, ${darken})`;
            }
            this.ctx.fillRect(b.x, b.y - b.h, b.w, b.h);

            // Windows (Strict Economy Correlation)
            // litRatio defines the % of windows that SHOULD be on.
            let litRatio = this.metrics.economy / 100;

            // BLACKOUT EVENT: Kill all lights
            if (this.currentEvent === 'blackout') {
                litRatio = 0;
            }

            b.windows.forEach((w, i) => {
                // Fire overrides everything
                if (b.isOnFire) {
                    // Windows glow with fire (random)
                    if (Math.random() < 0.8 * b.fireIntensity) {
                        const flicker = Math.random() > 0.5 ? '#ffaa00' : '#ff4400';
                        this.ctx.fillStyle = flicker;
                        // Add bloom
                        this.ctx.save();
                        this.ctx.globalCompositeOperation = 'screen';
                        this.ctx.globalAlpha = 0.5 * b.fireIntensity;
                        this.ctx.fillStyle = '#ff8800';
                        this.ctx.fillRect(b.x + w.x - 2, b.y - b.h + w.y - 2, w.w + 4, w.h + 4);
                        this.ctx.restore();
                    } else {
                        this.ctx.fillStyle = '#1a0505'; // Burnt out
                    }
                }
                // Normal Logic
                else {
                    if ((i / b.windows.length) < litRatio) {
                        // IT IS LIT
                        // Economy Flicker Logic (Random)
                        let isFlickering = false;
                        if (this.metrics.economy < 40 && Math.random() > 0.9) {
                            isFlickering = true;
                        }

                        if (isFlickering) {
                            this.ctx.fillStyle = '#111'; // Flicker off
                        } else {
                            this.ctx.fillStyle = '#ffeebb'; // Warm Light
                            // Bloom
                            this.ctx.globalAlpha = 0.3;
                            this.ctx.fillStyle = '#ffcc88';
                            this.ctx.fillRect(b.x + w.x - 1, b.y - b.h + w.y - 1, w.w + 2, w.h + 2);
                            this.ctx.globalAlpha = 1.0;
                            this.ctx.fillStyle = '#ffeebb';
                        }
                    } else {
                        // UNLIT
                        this.ctx.fillStyle = '#0d0d15';
                    }
                }
                this.ctx.fillRect(b.x + w.x, b.y - b.h + w.y, w.w, w.h);
            });
        });

        // === 7. PARTICLES (Fire/Smoke) ===
        this.particles.forEach(p => {
            if (p.type === 'fire') {
                // Color ramp: White -> Yellow -> Orange -> Red -> Transparent
                const lifeRatio = p.life / p.maxLife;
                if (lifeRatio > 0.8) this.ctx.fillStyle = '#ffffaa'; // White/Yellow heart
                else if (lifeRatio > 0.5) this.ctx.fillStyle = '#ffcc00'; // Yellow
                else if (lifeRatio > 0.2) this.ctx.fillStyle = '#ff4400'; // Orange/Red
                else this.ctx.fillStyle = `rgba(100, 0, 0, ${lifeRatio})`; // Fading red
            } else {
                // Smoke
                const lifeRatio = p.life / p.maxLife;
                this.ctx.fillStyle = `rgba(50, 50, 50, ${lifeRatio * 0.5})`;
            }
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // === 8. CARS ===
        this.cars.forEach(c => {
            const w = c.width || 10;
            const h = c.type === 'fire_engine' ? 8 : 6;

            this.ctx.fillStyle = c.color;
            this.ctx.fillRect(c.x, c.y, w, h);

            // Lights
            if (c.type === 'police' || c.type === 'fire_engine') {
                // Flashing Top Light
                // Fire engines flash red/white, Police red/blue
                const color1 = '#f00';
                const color2 = c.type === 'police' ? '#00f' : '#fff';

                this.ctx.fillStyle = this.time % 0.2 < 0.1 ? color1 : color2;
                this.ctx.fillRect(c.x + w / 2 - 2, c.y - 2, 4, 3);
            }

            // Headlights (White/Yellow) - Front
            this.ctx.fillStyle = '#fff';
            if (c.vx > 0) { // Moving Right
                this.ctx.fillRect(c.x + w, c.y + 1, 2, 2); // Front Top
                this.ctx.fillRect(c.x + w, c.y + h - 2, 2, 2); // Front Bottom
            } else { // Moving Left
                this.ctx.fillRect(c.x - 2, c.y + 1, 2, 2); // Front Top
                this.ctx.fillRect(c.x - 2, c.y + h - 2, 2, 2); // Front Bottom
            }

            // Taillights (Red) - Back
            this.ctx.fillStyle = '#cc0000';
            if (c.vx > 0) { // Moving Right
                this.ctx.fillRect(c.x - 1, c.y + 1, 1, 2); // Back Top
                this.ctx.fillRect(c.x - 1, c.y + h - 2, 1, 2); // Back Bottom
            } else { // Moving Left
                this.ctx.fillRect(c.x + w, c.y + 1, 1, 2); // Back Top
                this.ctx.fillRect(c.x + w, c.y + h - 2, 1, 2); // Back Bottom
            }
        });

        // === 8b. FLYING VEHICLES (Sky Layer) ===
        // Flying Cars
        this.flyingCars.forEach(fc => {
            // Glowing trail
            this.ctx.fillStyle = fc.color + '33'; // Semi-transparent
            this.ctx.fillRect(fc.x - fc.width, fc.y, fc.width * 2, fc.height);

            // Main body
            this.ctx.fillStyle = fc.color;
            this.ctx.fillRect(fc.x, fc.y, fc.width, fc.height);

            // Bright front light
            this.ctx.fillStyle = '#ffffff';
            if (fc.vx > 0) {
                this.ctx.fillRect(fc.x + fc.width, fc.y + 1, 2, 2);
            } else {
                this.ctx.fillRect(fc.x - 2, fc.y + 1, 2, 2);
            }
        });

        // Drones
        this.drones.forEach(d => {
            // Blinking light
            const blink = Math.sin(d.blinkPhase) > 0;
            if (blink) {
                this.ctx.fillStyle = d.color + '66';
                this.ctx.fillRect(d.x - d.size * 2, d.y - d.size * 2, d.size * 4, d.size * 4);
            }

            // Drone body
            this.ctx.fillStyle = d.color;
            this.ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);

            // Propeller blur (4 corners)
            this.ctx.fillStyle = '#ffffff22';
            this.ctx.fillRect(d.x - d.size, d.y - d.size, 2, 2);
            this.ctx.fillRect(d.x + d.size, d.y - d.size, 2, 2);
            this.ctx.fillRect(d.x - d.size, d.y + d.size, 2, 2);
            this.ctx.fillRect(d.x + d.size, d.y + d.size, 2, 2);
        });

        // === 9. STATUS BILLBOARD ===
        if (this.billboard.assigned) {
            const bx = this.billboard.x;
            const by = this.billboard.y;
            const bw = this.billboard.w;
            const bh = this.billboard.h;

            // Frame
            this.ctx.fillStyle = '#0a0a10';
            this.ctx.fillRect(bx, by, bw, bh);
            this.ctx.strokeStyle = '#333';
            this.ctx.strokeRect(bx, by, bw, bh);

            // Poles
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(bx + 3, by + bh, 2, 20);
            this.ctx.fillRect(bx + bw - 5, by + bh, 2, 20);

            // Status Color
            let statusColor = status >= 70 ? '#0f0' : (status >= 40 ? '#ff0' : '#f00');
            if (status < 40 && this.time % 1 > 0.5) statusColor = '#600'; // Flicker

            // Text
            this.ctx.fillStyle = statusColor;
            this.ctx.font = 'bold 8px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${Math.floor(status)}%`, bx + bw / 2, by + bh - 3);

            // Scanlines
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let i = 0; i < bh; i += 2) this.ctx.fillRect(bx, by + i, bw, 1);
        }

        // === 10. WATER (Environment) ===
        const waterColor = env >= 60 ? '#1a1528' : (env >= 30 ? '#1a1a15' : '#0a1a05'); // Blue -> Grey -> Toxic Green
        this.ctx.fillStyle = waterColor;
        this.ctx.fillRect(0, horizonY, this.renderWidth, this.renderHeight - horizonY);

        // Reflection (Wobble increases with instability)
        const wobbleAmp = status >= 70 ? 0.5 : (status >= 40 ? 1.5 : 3);
        const eventWobble = this.currentEvent === 'acid_rain' || this.currentEvent === 'heatwave' ? 5 : wobbleAmp;

        for (let y = 0; y < this.renderHeight - horizonY; y++) {
            const sy = horizonY - 1 - y;
            if (sy < 0) continue;
            const ox = Math.sin(y * 0.2 + this.time * 2) * eventWobble * (y / 20);

            this.ctx.save();
            this.ctx.globalAlpha = 0.4 * (1 - y / (this.renderHeight - horizonY));
            this.ctx.drawImage(this.canvas, 0, sy, this.renderWidth, 1, ox, horizonY + y, this.renderWidth, 1);
            this.ctx.restore();
        }

        // === 11. EVENT OVERLAYS ===
        if (this.currentEvent) {
            this.ctx.save();
            if (this.currentEvent === 'blackout') {
                // Darken everything except fire/cars
                this.ctx.fillStyle = 'rgba(0, 0, 5, 0.6)';
                this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
            }
            else if (this.currentEvent === 'acid_rain') {
                // Green tint + Rain
                this.ctx.fillStyle = 'rgba(0, 50, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
                // Heavy Rain
                this.ctx.strokeStyle = '#5f5';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                for (let i = 0; i < 50; i++) {
                    const rx = Math.random() * this.renderWidth;
                    const ry = Math.random() * this.renderHeight;
                    this.ctx.moveTo(rx, ry);
                    this.ctx.lineTo(rx - 5, ry + 15);
                }
                this.ctx.stroke();
            }
            else if (this.currentEvent === 'glitch') {
                // 1. RGB Split (poor man's chromatic aberration)
                if (Math.random() > 0.5) {
                    const shift = (Math.random() - 0.5) * 10;
                    // Draw red channel offset
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'screen';
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillStyle = 'red';
                    // We need to draw the canvas onto itself, but we can't do that easily without a buffer.
                    // Fallback: Just draw offset rectangles for now or shift the whole view.
                    this.ctx.translate(shift, 0);
                    this.ctx.drawImage(this.canvas, 0, 0);
                    this.ctx.restore();
                }

                // 2. Random Digital Artifacts
                if (Math.random() > 0.7) {
                    const h = Math.random() * 50 + 10;
                    const y = Math.random() * this.renderHeight;
                    const w = Math.random() * this.renderWidth;
                    const x = Math.random() * this.renderWidth;

                    this.ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,0,0,0.4)' : 'rgba(0,255,255,0.4)';
                    this.ctx.fillRect(x, y, w, h);
                }
            }
            else if (this.currentEvent === 'heatwave') {
                // Red Haze
                this.ctx.fillStyle = 'rgba(255, 50, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);

                // Giant Pulsating Sun Overlay
                const sunSize = 100 + Math.sin(this.time * 5) * 20;
                const sunY = this.renderHeight * 0.55 - 25; // Horizon Y
                const sunGrad = this.ctx.createRadialGradient(this.renderWidth / 2, sunY, 20, this.renderWidth / 2, sunY, sunSize);
                sunGrad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
                sunGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                this.ctx.fillStyle = sunGrad;
                this.ctx.fillRect(0, 0, this.renderWidth, this.renderHeight);
            }
            this.ctx.restore();
        }
    }

    // --- MAIN LOOP ---
    animate(now) {
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt || 0.016);
        this.draw();

        requestAnimationFrame(this.animate);
    }
}
