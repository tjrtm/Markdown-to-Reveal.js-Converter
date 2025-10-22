/**
 * PresentFlow Pro - Main Entry Point
 */

import './styles/globals.css';
import { App } from './app';
import { stateManager } from './core/state/StateManager';

// Initialize mermaid
if (typeof (window as any).mermaid !== 'undefined') {
  (window as any).mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
  });
}

// Initialize app
async function init() {
  try {
    console.log('🚀 Initializing PresentFlow Pro...');

    // Detect system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = stateManager.getState().theme;

    if (currentTheme === 'auto') {
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(currentTheme);
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (stateManager.getState().theme === 'auto') {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(e.matches ? 'dark' : 'light');
      }
    });

    // Create app instance
    const app = new App();
    await app.init();

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
      }, 500);
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      app.showError('An unexpected error occurred. Please refresh the page.');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      app.showError('An unexpected error occurred. Please refresh the page.');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S: Save project
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        app.saveProject();
      }

      // Ctrl/Cmd + N: New project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        app.newProject();
      }

      // Ctrl/Cmd + O: Open project
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        app.openProject();
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        stateManager.undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        stateManager.redo();
      }

      // Escape: Exit fullscreen/presentation mode
      if (e.key === 'Escape') {
        const state = stateManager.getState();
        if (state.ui.isPresenting) {
          app.exitPresentation();
        }
      }

      // F11: Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        app.toggleFullscreen();
      }
    });

    // Make app globally accessible for debugging
    (window as any).app = app;
    (window as any).stateManager = stateManager;

    console.log('✅ PresentFlow Pro initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);

    // Show error message
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <div>
            <h1 style="font-size: 32px; margin-bottom: 16px;">Failed to Initialize</h1>
            <p style="color: #94a3b8; margin-bottom: 24px;">
              An error occurred while loading the application.
            </p>
            <button
              onclick="location.reload()"
              style="
                padding: 12px 24px;
                background: #38bdf8;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
              "
            >
              Reload Page
            </button>
          </div>
        </div>
      `;
    }

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }
}

// Start the app
init();
