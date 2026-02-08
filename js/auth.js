class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.usersKey = 'timeline_users';
        this.sessionKey = 'timeline_session';
        this.loadSession();
    }

    // Load active session from local storage
    loadSession() {
        const savedUser = localStorage.getItem(this.sessionKey);
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            return this.currentUser;
        }
        return null;
    }

    // Register a new user
    signup(username, password) {
        const users = this.getUsers();
        if (users[username]) {
            return { success: false, message: 'Agent ID already exists.' };
        }

        const newUser = {
            username: username,
            password: password, // In a real app, hash this!
            highScore: 0,
            gamesPlayed: 0,
            joined: new Date().toISOString()
        };

        users[username] = newUser;
        this.saveUsers(users);
        this.login(username, password);
        return { success: true, user: newUser };
    }

    // Login existing user
    login(username, password) {
        const users = this.getUsers();
        const user = users[username];

        if (user && user.password === password) {
            this.currentUser = user;
            localStorage.setItem(this.sessionKey, JSON.stringify(user));
            return { success: true, user: user };
        }
        return { success: false, message: 'Invalid credentials.' };
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
    }

    // Update user stats
    updateStats(score) {
        if (!this.currentUser) return;

        const users = this.getUsers();
        const user = users[this.currentUser.username];

        user.gamesPlayed++;
        if (score > user.highScore) {
            user.highScore = score;
        }

        this.currentUser = user; // Update local session
        users[user.username] = user; // Update db
        this.saveUsers(users);
        localStorage.setItem(this.sessionKey, JSON.stringify(user));
    }

    // Helper: Get all users
    getUsers() {
        const users = localStorage.getItem(this.usersKey);
        return users ? JSON.parse(users) : {};
    }

    // Helper: Save users
    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    getCurrentUser() {
        return this.currentUser;
    }
}
