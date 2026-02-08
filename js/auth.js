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

    // Helper: Create offline session
    createOfflineSession(username) {
        const offlineUser = {
            username: username,
            uid: 'offline_' + Date.now(),
            highScore: 0,
            gamesPlayed: 0,
            joined: new Date().toISOString(),
            isOffline: true
        };
        this.currentUser = offlineUser;
        // Save to local storage for persistence across reloads (offline mode)
        localStorage.setItem('timeline_offline_user', JSON.stringify(offlineUser));
        return { success: true, user: offlineUser, message: 'Network offline. Playing in Guest Mode.' };
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

            // 2. Create Firestore Document (Optimistic)
            const newUser = {
                username: username,
                highScore: 0,
                gamesPlayed: 0,
                joined: new Date().toISOString()
            };

            try {
                await this.withTimeout(
                    db.collection('users').doc(user.uid).set(newUser),
                    5000
                );
            } catch (dbError) {
                console.warn("Auth: DB write timed out. Continuing offline.", dbError);
            }

            this.currentUser = { ...newUser, uid: user.uid };
            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error("Signup Error:", error);
            // FAIL-SAFE: If offline, allow play anyway
            if (error.code === 'auth/network-request-failed' || error.message.includes('timeout')) {
                return this.createOfflineSession(username);
            }

            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = 'Agent ID already taken.';
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
            // FAIL-SAFE: If offline, allow play anyway
            if (error.code === 'auth/network-request-failed' || error.message.includes('timeout')) {
                // Try to recover last offline session or create new
                const saved = localStorage.getItem('timeline_offline_user');
                if (saved) {
                    this.currentUser = JSON.parse(saved);
                    if (this.currentUser.username === username) {
                        return { success: true, user: this.currentUser, message: 'Offline. Loaded local profile.' };
                    }
                }
                return this.createOfflineSession(username);
            }
            return { success: false, message: 'Invalid credentials.' };
        }
    }

    // Logout
    async logout() {
        if (this.currentUser && this.currentUser.isOffline) {
            this.currentUser = null;
            // Optional: clear offline data? No, keep it.
        } else {
            await auth.signOut();
        }
        // Listener nulls currentUser
    }

    // Update user stats in Firestore or Local
    async updateStats(score) {
        if (!this.currentUser) return;

        // Offline Path
        if (this.currentUser.isOffline) {
            this.currentUser.gamesPlayed++;
            this.currentUser.highScore = Math.max(this.currentUser.highScore, score);
            localStorage.setItem('timeline_offline_user', JSON.stringify(this.currentUser));
            console.log('Stats saved locally (Offline Mode).');
            return;
        }

        // Online Path
        if (!this.currentUser.uid) return;
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
