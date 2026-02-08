class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.cameraX = 0;
        this.targetCameraX = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initial node
        this.addNode(0, 50, 'start');

        // this.startAnimation(); // Controlled by GameController now
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.centerY = this.canvas.height / 2;

        // Recalculate Y positions for all nodes based on new height
        this.nodes.forEach(node => {
            if (node.yPercent !== undefined) {
                node.y = (node.yPercent / 100) * this.canvas.height;
            }
        });
    }

    addNode(xOffset, yPercent, type = 'normal') {
        const node = {
            x: this.nodes.length > 0 ? this.nodes[this.nodes.length - 1].x + 100 : 50,
            y: (yPercent / 100) * this.canvas.height,
            yPercent: yPercent, // Store percentage for resizing
            type: type, // 'normal', 'branch_a', 'branch_b', 'drift'
            active: true,
            alpha: 0
        };
        this.nodes.push(node);
        this.targetCameraX = node.x - this.canvas.width / 2;
    }

    // Called when a decision is made to branch the timeline
    branch(choiceType) {
        const lastNode = this.nodes[this.nodes.length - 1];

        // Calculate new Y based on choice (visual metaphor: up/down)
        let newYPercent = lastNode.yPercent !== undefined ? lastNode.yPercent : (lastNode.y / this.canvas.height) * 100;

        if (choiceType === 'a') newYPercent -= 10;
        if (choiceType === 'b') newYPercent += 10;

        // Clamp
        newYPercent = Math.max(10, Math.min(90, newYPercent));

        this.addNode(0, newYPercent, `branch_${choiceType}`);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera
        this.cameraX += (this.targetCameraX - this.cameraX) * 0.05;

        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        // Draw connections
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f3ff';

        if (this.nodes.length > 0) {
            this.ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
            for (let i = 1; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const prev = this.nodes[i - 1];

                // Fade in effect
                if (node.alpha < 1) node.alpha += 0.05;

                this.ctx.globalAlpha = node.alpha;

                // smooth curve
                const cpX = (prev.x + node.x) / 2;
                this.ctx.bezierCurveTo(cpX, prev.y, cpX, node.y, node.x, node.y);
            }
            this.ctx.stroke();
        }

        // Draw nodes
        for (const node of this.nodes) {
            this.ctx.globalAlpha = node.alpha;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
            this.ctx.fill();

            // Pulse effect for last node
            if (node === this.nodes[this.nodes.length - 1]) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
                this.ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    startAnimation() {
        if (this.running) return;
        this.running = true;
        const animate = () => {
            if (!this.running) return;
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        this.running = false;
    }

    reset() {
        this.nodes = [];
        this.cameraX = 0;
        this.targetCameraX = 0;
        this.addNode(0, 50, 'start');
    }
}
