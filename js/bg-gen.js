class BackgroundGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1920;
        this.height = 1080;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    generate(theme, metrics = { stability: 50, economy: 50, environment: 50, trust: 50 }) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Base Sky
        this.drawSky(metrics);

        // Distant Mountains / Horizon
        this.drawMountains(metrics);

        // Middle Ground (City/Structures)
        this.drawCity(metrics);

        // Foreground (Ground/Nature)
        this.drawForeground(metrics);

        // Weather/Atmosphere Overlay
        this.drawAtmosphere(metrics);

        return this.canvas.toDataURL('image/jpeg', 0.9);
    }

    drawSky(metrics) {
        let topColor, botColor;

        if (metrics.environment < 40) {
            // Smoggy/Polluted
            topColor = '#5c5c5c';
            botColor = '#8a7f6b';
        } else if (metrics.environment > 70) {
            // Clean Blue
            topColor = '#0066cc';
            botColor = '#66ccff';
        } else {
            // Normal
            topColor = '#1a1a2e'; // Night/Dusk default for game mood
            botColor = '#2d4059';
        }

        if (metrics.stability < 30) {
            // Red tint for chaos
            topColor = '#2e0000';
            botColor = '#591a1a';
        }

        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, topColor);
        grad.addColorStop(1, botColor);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars if dark
        if (metrics.environment > 50 && metrics.stability > 40) {
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 100; i++) {
                this.ctx.fillRect(Math.random() * this.width, Math.random() * (this.height / 2), Math.random() * 2, Math.random() * 2);
            }
        }
    }

    drawMountains(metrics) {
        const baseH = this.height * 0.6;
        const color = metrics.environment < 40 ? '#2b2b2b' : '#1e212d'; // Dead vs Dark Rock

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(0, baseH);

        let x = 0;
        while (x < this.width) {
            x += 100 + Math.random() * 200;
            const h = baseH - Math.random() * 200;
            this.ctx.lineTo(x, h);
        }

        this.ctx.lineTo(this.width, this.height);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawCity(metrics) {
        // Economy determines density and lights
        // Stability determines damage/fire

        const density = Math.floor(metrics.economy / 5) + 5; // 5 to 25 buildings
        const width = this.width / density;

        for (let i = 0; i < density; i++) {
            const h = 200 + Math.random() * (metrics.economy * 8); // Taller if richer
            const x = i * width + (Math.random() * 20);
            const w = width - 10;

            // Building Color
            const isRuined = metrics.stability < 30 && Math.random() > 0.7;
            this.ctx.fillStyle = isRuined ? '#1a1a1a' : '#0f1020';
            this.ctx.fillRect(x, this.height - h, w, h);

            // Windows
            if (!isRuined) {
                const lightColor = metrics.stability > 50 ? '#ffff00' : '#ff5500'; // Warm vs Warning
                this.ctx.fillStyle = lightColor;
                const winRows = h / 20;
                const winCols = w / 15;

                for (let r = 0; r < winRows; r++) {
                    for (let c = 0; c < winCols; c++) {
                        if (Math.random() > 0.6) { // Random lights on
                            this.ctx.fillRect(x + 5 + c * 15, this.height - h + 5 + r * 20, 5, 10);
                        }
                    }
                }
            } else {
                // Fire
                this.drawFire(x + w / 2, this.height - h / 2, w);
            }
        }
    }

    drawForeground(metrics) {
        // Nature / Ground
        const groundColor = metrics.environment < 40 ? '#3d3d3d' : '#0b1d12'; // Ash vs Dark Green

        // Hills
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(0, this.height - 150);
        this.ctx.quadraticCurveTo(this.width / 2, this.height - 250, this.width, this.height - 150);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.fillStyle = groundColor;
        this.ctx.fill();

        // Trees
        const treeCount = metrics.environment < 30 ? 5 : (metrics.environment / 2);
        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * this.width;
            const y = this.height - 100 - Math.random() * 50;
            this.drawTree(x, y, metrics.environment < 40);
        }
    }

    drawTree(x, y, isDead) {
        const h = 60 + Math.random() * 40;

        // Trunk
        this.ctx.fillStyle = '#1a0b00';
        this.ctx.fillRect(x, y, 10, h);

        if (!isDead) {
            // Leaves
            this.ctx.beginPath();
            this.ctx.moveTo(x - 20, y + 20);
            this.ctx.lineTo(x + 30, y + 20);
            this.ctx.lineTo(x + 5, y - 40);
            this.ctx.fillStyle = '#0f2b1d';
            this.ctx.fill();
        } else {
            // Dead branches
            this.ctx.strokestyle = '#1a0b00';
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5, y + 20);
            this.ctx.lineTo(x - 10, y - 10);
            this.ctx.stroke();
        }
    }

    drawAtmosphere(metrics) {
        if (metrics.environment < 50) {
            // Smog overlay
            this.ctx.fillStyle = 'rgba(100, 80, 50, 0.2)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Rain
        if (metrics.climateRisk > 50 || Math.random() > 0.8) {
            this.ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x - 2, y + 15);
            }
            this.ctx.stroke();
        }
    }

    drawFire(x, y, size) {
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
