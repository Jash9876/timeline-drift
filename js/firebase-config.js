// Firebase Configuration
// Using Compat libraries for Vanilla JS without bundler
const firebaseConfig = {
    apiKey: "AIzaSyDl9Ni5DmRCfmqSiPKpGLBeRiSbbHwbXQM",
    authDomain: "timeline-drift.firebaseapp.com",
    projectId: "timeline-drift",
    storageBucket: "timeline-drift.firebasestorage.app",
    messagingSenderId: "1084160800717",
    appId: "1:1084160800717:web:963a39534dff4fc57c3684",
    measurementId: "G-B3D86DELHW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics(); // Optional
