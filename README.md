# Timeline Drift

**One decision. Infinite futures.**

A cinematic, browser-based decision game that visualizes the butterfly effect. Players make policy and ethical choices that branch into different future timelines, rendered in a high-contrast sci-fi aesthetic.

## 🎮 How to Play

1.  **Login/Sign Up**: Create a local agent profile to track your high scores.
2.  **Make Decisions**: You are presented with binary choices (e.g., "Allow AI Surveillance" vs. "Ban It").
3.  **Manage Metrics**: Balance Stability, Economy, Environment, and Public Trust. If any metric drops to 0%, the simulation collapses.
4.  **Watch the Timeline**: Every decision branches the visual timeline.
5.  **Survive**: Try to last as many years as possible to top the leaderboard.

## 🛠️ Technical Overview

-   **Stack**: HTML5, CSS3, Vanilla JavaScript.
-   **No Backend**: Uses `localStorage` to simulate a database for user sessions and high scores.
-   **Canvas API**: Used for the procedural timeline branching animation.
-   **Glassmorphism UI**: Custom CSS for a premium sci-fi look.

## 🚀 How to Run

1.  Clone the repository.
2.  Open `index.html` in any modern web browser.
3.  That's it! No `npm install` or server required.

## 🌐 Deployment

This project is static and ready for:
-   **GitHub Pages**: Push to a repo and enable Pages.
-   **Netlify/Vercel**: Drag and drop the folder.

## 📂 Project Structure

-   `index.html`: Main entry point.
-   `css/styles.css`: All visual styling and animations.
-   `js/`:
    -   `engine.js`: Game logic and probability model.
    -   `data.js`: Scenario content.
    -   `visualizer.js`: Canvas animation logic.
    -   `auth.js` & `leaderboard.js`: User system.
    -   `game.js`: Main controller.

---
*Created by Antigravity*
