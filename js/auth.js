class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.onUserChangeCallback = null;

        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Fetch extra user data from Firestore
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists) {
                        this.currentUser = doc.data();
                        this.currentUser.uid = user.uid; // Store UID
                        console.log('Auth: User loaded', this.currentUser);
                        if (this.onUserChangeCallback) this.onUserChangeCallback(this.currentUser);
                    } else {
                        // Rare case: Auth exists but DB doc missing
                        console.error('Auth: User authenticated but no DB record found.');
                    }
                });
            } else {
                this.currentUser = null;
                console.log('Auth: User signed out');
                if (this.onUserChangeCallback) this.onUserChangeCallback(null);
            }
        });
    }

    // Callback to update UI when auth state resolves
    onUserChange(callback) {
        this.onUserChangeCallback = callback;
    }

    // Helper: Fake email generator for username-based login
    getEmail(username) {
        return `${username.toLowerCase()}@timeline-drift.game`;
    }

    // Helper: Timeout wrapper
    withTimeout(promise, ms = 10000) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout. Check connection.')), ms))
        ]);
    }

    // Register a new user
    async signup(username, password) {
        const email = this.getEmail(username);
        try {
            // 1. Create Auth User (with timeout)
            const userCredential = await this.withTimeout(
                auth.createUserWithEmailAndPassword(email, password)
            );
            const user = userCredential.user;

            // 2. Create Firestore Document (Optimistic: don't block UI if this part hangs)
            const newUser = {
                username: username,
                highScore: 0,
                gamesPlayed: 0,
                joined: new Date().toISOString()
            };

            // We await this but catch errors specifically for it so we can still log the user in
            // if the DB write fails/hangs (common in poor network conditions)
            try {
                await this.withTimeout(
                    db.collection('users').doc(user.uid).set(newUser),
                    5000 // Shorter timeout for DB
                );
            } catch (dbError) {
                console.warn("Auth: DB write timed out or failed. Continuing mostly offline.", dbError);
                // Proceed anyway, the Auth part succeeded.
            }

            this.currentUser = { ...newUser, uid: user.uid };
            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error("Signup Error:", error);
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = 'Agent ID already taken.';
            if (error.message.includes('timeout')) msg = 'Connection timed out. Check internet.';
            return { success: false, message: msg };
        }
    }

    // Login existing user
    async login(username, password) {
        const email = this.getEmail(username);
        try {
            await this.withTimeout(
                auth.signInWithEmailAndPassword(email, password)
            );
            // currentUser will be set by onAuthStateChanged listener
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            let msg = 'Invalid credentials.';
            if (error.message.includes('timeout') || error.code === 'auth/network-request-failed') {
                msg = 'Network error. Check connection.';
            }
            return { success: false, message: msg };
        }
    }

    // Logout
    async logout() {
        await auth.signOut();
        // Listener nulls currentUser
    }

    // Update user stats in Firestore
    async updateStats(score) {
        if (!this.currentUser || !this.currentUser.uid) return;

        const userRef = db.collection('users').doc(this.currentUser.uid);

        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                if (!doc.exists) return;

                const data = doc.data();
                const newGamesPlayed = (data.gamesPlayed || 0) + 1;
                const newHighScore = Math.max(data.highScore || 0, score);

                transaction.update(userRef, {
                    gamesPlayed: newGamesPlayed,
                    highScore: newHighScore,
                    lastActive: new Date().toISOString()
                });

                // Update local state
                this.currentUser.gamesPlayed = newGamesPlayed;
                this.currentUser.highScore = newHighScore;
            });
            console.log('Stats saved to cloud.');
        } catch (e) {
            console.error("Failed to save stats:", e);
        }
    }
}
