class LeaderboardSystem {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    // Get sorted leaderboard data from Firestore
    async getLeaderboard() {
        const scores = [];
        try {
            const snapshot = await db.collection('users')
                .orderBy('highScore', 'desc')
                .limit(10)
                .get();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.highScore > 0) {
                    scores.push({
                        username: data.username,
                        highScore: data.highScore
                    });
                }
            });
        } catch (error) {
            console.error("Leaderboard fetch error:", error);
        }
        return scores;
    }

    // Render leaderboard to UI
    async render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner">LOADING DATA...</div>';

        const data = await this.getLeaderboard();
        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">No records yet. Be the first!</div>';
            return;
        }

        data.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';

            // Highlight current user
            const isCurrentUser = this.auth.currentUser && this.auth.currentUser.username === entry.username;
            if (isCurrentUser) {
                row.style.background = 'rgba(0, 243, 255, 0.2)';
                row.style.border = '1px solid var(--primary-cyan)';
            }

            row.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${entry.username}</span>
                <span class="score">${entry.highScore}</span>
            `;
            container.appendChild(row);
        });
    }
}
