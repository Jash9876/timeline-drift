class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.onUserChangeCallback = null;
        this.checkConnection(); // Initial check

        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Fetch extra user data from Firestore
                this.withTimeout(
                    db.collection('users').doc(user.uid).get(),
                    5000 // 5s timeout for user data
                ).then((doc) => {
                    if (doc && doc.exists) {
                        this.currentUser = doc.data();
                        this.currentUser.uid = user.uid; // Store UID
                        console.log('Auth: User loaded', this.currentUser);
                        this.updateConnectionStatus(true);
                        if (this.onUserChangeCallback) this.onUserChangeCallback(this.currentUser);
                    } else {
                        // Rare case: Auth exists but DB doc missing via timeout or actual missing
                        console.warn('Auth: User authenticated but DB record missing or timed out.');
                        // Still allow play, maybe create basic user?
                        this.currentUser = { uid: user.uid, username: user.email ? user.email.split('@')[0] : 'Agent' };
                        if (this.onUserChangeCallback) this.onUserChangeCallback(this.currentUser);
                    }
                }).catch(err => {
                    console.error("Auth: Failed to load user profile (Offline?)", err);
                    // Fallback to basic auth user if DB fails
                    this.currentUser = { uid: user.uid, username: user.email ? user.email.split('@')[0] : 'Agent', isOffline: true };
                    if (this.onUserChangeCallback) this.onUserChangeCallback(this.currentUser);
                });
            } else {
                this.currentUser = null;
                console.log('Auth: User signed out');
                if (this.onUserChangeCallback) this.onUserChangeCallback(null);
            }
        });

        // Periodic connection check
        setInterval(() => this.checkConnection(), 30000);
    }

    // Diagnostic: Check if we can reach Google
    async checkConnection() {
        const statusEl = document.getElementById('connection-status');
        if (!statusEl) return;

        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
            this.updateConnectionStatus(true);
        } catch (e) {
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.innerText = isOnline ? 'Neural Link: ACTIVE' : 'Neural Link: OFFLINE (Local Mode)';
            statusEl.className = 'connection-status ' + (isOnline ? 'online' : 'offline');
        }
    }

    // Callback to update UI when auth state resolves
    onUserChange(callback) {
        this.onUserChangeCallback = callback;
    }

    // Helper: Create offline session
    createOfflineSession(username) {
        console.log("Auth: Creating Offline Session for", username);
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
        this.updateConnectionStatus(false);
        return { success: true, user: offlineUser, message: 'Network disconnected. Playing in Guest Mode (Offline).' };
    }

    // Helper: Fake email generator for username-based login
    getEmail(username) {
        return `${username.toLowerCase()}@timeline-drift.game`;
    }

    // Helper: Timeout wrapper
    withTimeout(promise, ms = 5000) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms))
        ]);
    }

    async signup(username, password) {
        console.log("Auth: Attempting signup for", username);
        // FAST FAIL: Client-side validation to avoid network noise
        if (password.length < 6) {
            return { success: false, message: 'Passcode too short (min 6 chars).' };
        }

        const email = this.getEmail(username);
        try {
            // 1. Create Auth User (with timeout)
            const userCredential = await this.withTimeout(
                auth.createUserWithEmailAndPassword(email, password),
                8000 // 8s timeout for auth
            );
            const user = userCredential.user;

            // 2. Create Firestore Document (Optimistic)
            const newUser = {
                username: username,
                highScore: 0,
                gamesPlayed: 0,
                joined: new Date().toISOString()
            };

            // Attempt DB write, but don't fail signup if it fails (just go offline-ish)
            this.withTimeout(
                db.collection('users').doc(user.uid).set(newUser),
                3000
            ).catch(dbError => {
                console.warn("Auth: DB write timed out. Continuing...", dbError);
            });

            this.currentUser = { ...newUser, uid: user.uid };
            this.updateConnectionStatus(true);
            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error("Signup Error:", error);
            // FAIL-SAFE: If offline, allow play anyway
            if (error.code === 'auth/network-request-failed' ||
                error.message.includes('timeout') ||
                error.message.includes('network') ||
                !navigator.onLine) {
                return this.createOfflineSession(username);
            }

            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = 'Agent ID already taken.';
            if (error.code === 'auth/weak-password') msg = 'Passcode too short (min 6 chars).';
            return { success: false, message: msg };
        }
    }

    // Login existing user
    async login(username, password) {
        console.log("Auth: Attempting login for", username);
        const email = this.getEmail(username);
        try {
            const userCredential = await this.withTimeout(
                auth.signInWithEmailAndPassword(email, password),
                8000
            );
            const user = userCredential.user;

            // Fetch user data from Firestore immediately (like signup does)
            try {
                const doc = await this.withTimeout(
                    db.collection('users').doc(user.uid).get(),
                    5000
                );

                if (doc && doc.exists) {
                    this.currentUser = doc.data();
                    this.currentUser.uid = user.uid;
                    this.updateConnectionStatus(true);
                    console.log('Auth: Login successful, user loaded:', this.currentUser);
                    return { success: true, user: this.currentUser };
                } else {
                    // DB doc missing, create basic user from auth
                    console.warn('Auth: User authenticated but DB record missing.');
                    this.currentUser = {
                        uid: user.uid,
                        username: username,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                    this.updateConnectionStatus(true);
                    return { success: true, user: this.currentUser };
                }
            } catch (dbError) {
                console.warn("Auth: DB fetch failed, using basic user data", dbError);
                // Fallback to basic user if DB fails
                this.currentUser = {
                    uid: user.uid,
                    username: username,
                    highScore: 0,
                    gamesPlayed: 0,
                    isOffline: true
                };
                return { success: true, user: this.currentUser };
            }
        } catch (error) {
            console.error("Login Error:", error);

            // FAIL-SAFE: If offline, allow play anyway
            if (error.code === 'auth/network-request-failed' ||
                error.message.includes('timeout') ||
                error.message.includes('network') ||
                !navigator.onLine) {

                // Try to recover last offline session or create new
                const saved = localStorage.getItem('timeline_offline_user');
                if (saved) {
                    try {
                        const savedUser = JSON.parse(saved);
                        if (savedUser.username === username) {
                            this.currentUser = savedUser;
                            this.updateConnectionStatus(false);
                            return { success: true, user: this.currentUser, message: 'Offline. Loaded local profile.' };
                        }
                    } catch (e) { console.error("Corrupt local save", e); }
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
