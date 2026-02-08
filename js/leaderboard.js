class LeaderboardSystem {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    // Get sorted leaderboard data (real users only)
    getLeaderboard() {
        const users = this.auth.getUsers();
        let allScores = [];

        // Add real users to the list
        for (const username in users) {
            if (users[username].highScore > 0) {
                allScores.push({
                    username: username,
                    highScore: users[username].highScore
                });
            }
        }

        // Sort descending
        allScores.sort((a, b) => b.highScore - a.highScore);

        // Return top 10
        return allScores.slice(0, 10);
    }

    // Render leaderboard to UI
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = this.getLeaderboard();
        container.innerHTML = '';

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
