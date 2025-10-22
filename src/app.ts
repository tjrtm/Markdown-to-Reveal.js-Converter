/**
 * Main Application Class
 */

import { stateManager } from './core/state/StateManager';
import type { Project, ToastMessage } from './types';
import { generateId } from './utils/helpers';
import { validateProject } from './utils/validation';

export class App {
  private container: HTMLElement;
  private toasts: Map<string, ToastMessage> = new Map();

  constructor() {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }
    this.container = app;
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    console.log('📱 Initializing App...');

    // Render the app
    this.render();

    // Subscribe to state changes
    stateManager.subscribe((state) => {
      console.log('State updated:', state);
      this.onStateChange();
    });

    // Load last project if exists
    this.loadLastProject();

    // Setup auto-save
    this.setupAutoSave();

    console.log('✅ App initialized');
  }

  /**
   * Render the application
   */
  private render(): void {
    const state = stateManager.getState();

    this.container.innerHTML = `
      <div class="app-layout h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <!-- Header -->
        <header class="glass-card m-4 p-4 flex items-center justify-between no-print">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold gradient-text-neon">🎭 PresentFlow Pro</h1>
            <div class="badge">v2.0</div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Mode Switcher -->
            <div class="flex gap-2 glass-card p-1 rounded-lg">
              <button
                id="mode-quick"
                class="px-4 py-2 rounded-md transition-all ${state.mode === 'quick' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}"
                data-mode="quick"
              >
                ⚡ Quick Mode
              </button>
              <button
                id="mode-advanced"
                class="px-4 py-2 rounded-md transition-all ${state.mode === 'advanced' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}"
                data-mode="advanced"
              >
                🎨 Advanced Mode
              </button>
            </div>

            <!-- Theme Switcher -->
            <button id="theme-toggle" class="btn-icon" title="Toggle theme">
              ${state.theme === 'dark' ? '🌙' : state.theme === 'light' ? '☀️' : '🌓'}
            </button>

            <!-- Settings -->
            <button id="settings-btn" class="btn-icon" title="Settings">
              ⚙️
            </button>

            <!-- Help -->
            <button id="help-btn" class="btn-icon" title="Help">
              ❓
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 flex gap-4 mx-4 mb-4 overflow-hidden">
          ${state.mode === 'quick' ? this.renderQuickMode() : this.renderAdvancedMode()}
        </main>

        <!-- Toast Container -->
        <div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 no-print">
        </div>

        <!-- Welcome Modal -->
        ${this.renderWelcomeModal()}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render quick mode
   */
  private renderQuickMode(): string {
    return `
      <div class="flex-1 grid grid-cols-2 gap-4">
        <!-- Editor Panel -->
        <div class="glass-card p-6 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">✏️ Editor</h2>
            <div class="flex gap-2">
              <button id="load-file-btn" class="btn-secondary text-sm">
                📁 Load File
              </button>
              <button id="save-project-btn" class="btn-secondary text-sm">
                💾 Save
              </button>
            </div>
          </div>

          <textarea
            id="markdown-editor"
            class="input-field flex-1 font-mono text-sm resize-none"
            placeholder="# Your Presentation Title

Start writing your presentation in Markdown...

Use --- to separate slides

## Features
- Full Markdown support
- Live preview
- Beautiful themes
- Export to multiple formats

---

## Next Slide

Your content here..."
          ></textarea>

          <div class="mt-4 flex gap-2">
            <button id="render-btn" class="btn-primary flex-1">
              🎬 Render Preview
            </button>
            <button id="export-btn" class="btn-secondary">
              📤 Export
            </button>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="glass-card p-6 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">👁️ Preview</h2>
            <button id="present-btn" class="btn-neon text-sm">
              🎬 Present
            </button>
          </div>

          <div id="preview-container" class="flex-1 bg-black/30 rounded-lg flex items-center justify-center">
            <div class="text-gray-500 text-center">
              <div class="text-4xl mb-2">👋</div>
              <p>Write some Markdown and click "Render Preview"</p>
            </div>
          </div>

          <div class="mt-4">
            <div class="divider mb-4"></div>
            <h3 class="text-sm font-semibold mb-2">🎨 Customization</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-400 block mb-1">Theme</label>
                <select id="slide-theme" class="input-field text-sm">
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="league">League</option>
                  <option value="beige">Beige</option>
                  <option value="sky">Sky</option>
                  <option value="night">Night</option>
                  <option value="serif">Serif</option>
                  <option value="simple">Simple</option>
                  <option value="solarized">Solarized</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1">Transition</label>
                <select id="slide-transition" class="input-field text-sm">
                  <option value="slide">Slide</option>
                  <option value="fade">Fade</option>
                  <option value="convex">Convex</option>
                  <option value="concave">Concave</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render advanced mode
   */
  private renderAdvancedMode(): string {
    return `
      <div class="flex-1 glass-card p-6 flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-4">🚧</div>
          <h2 class="text-2xl font-bold mb-2">Advanced Mode Coming Soon</h2>
          <p class="text-gray-400 mb-6">
            The visual node-based editor is under construction.<br>
            Use Quick Mode for now!
          </p>
          <button id="switch-to-quick" class="btn-primary">
            ⚡ Switch to Quick Mode
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render welcome modal
   */
  private renderWelcomeModal(): string {
    const hasSeenWelcome = localStorage.getItem('presentflow-welcome-seen');

    if (hasSeenWelcome) {
      return '';
    }

    return `
      <div class="modal-backdrop" id="welcome-modal">
        <div class="modal-content p-8 max-w-3xl">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">🎭</div>
            <h2 class="text-3xl font-bold gradient-text-neon mb-2">Welcome to PresentFlow Pro</h2>
            <p class="text-gray-400">Your modern presentation builder</p>
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex gap-4 items-start">
              <div class="text-2xl">⚡</div>
              <div>
                <h3 class="font-semibold mb-1">Quick Mode</h3>
                <p class="text-sm text-gray-400">Write presentations in Markdown with live preview and beautiful themes.</p>
              </div>
            </div>

            <div class="flex gap-4 items-start">
              <div class="text-2xl">🎨</div>
              <div>
                <h3 class="font-semibold mb-1">Advanced Mode (Coming Soon)</h3>
                <p class="text-sm text-gray-400">Visual node-based editor for complex presentations.</p>
              </div>
            </div>

            <div class="flex gap-4 items-start">
              <div class="text-2xl">📤</div>
              <div>
                <h3 class="font-semibold mb-1">Export Anywhere</h3>
                <p class="text-sm text-gray-400">Export to HTML, PDF, PPTX, and more.</p>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button id="close-welcome" class="btn-primary flex-1">
              Get Started
            </button>
            <button id="show-help" class="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Mode switcher
    document.getElementById('mode-quick')?.addEventListener('click', () => {
      stateManager.setMode('quick');
      this.render();
    });

    document.getElementById('mode-advanced')?.addEventListener('click', () => {
      stateManager.setMode('advanced');
      this.render();
    });

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const state = stateManager.getState();
      const themes: Array<'dark' | 'light' | 'auto'> = ['dark', 'light', 'auto'];
      const currentIndex = themes.indexOf(state.theme as any);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      stateManager.setTheme(nextTheme);
      this.render();
    });

    // Welcome modal
    document.getElementById('close-welcome')?.addEventListener('click', () => {
      localStorage.setItem('presentflow-welcome-seen', 'true');
      document.getElementById('welcome-modal')?.remove();
    });

    document.getElementById('show-help')?.addEventListener('click', () => {
      this.showHelp();
    });

    // Switch to quick mode
    document.getElementById('switch-to-quick')?.addEventListener('click', () => {
      stateManager.setMode('quick');
      this.render();
    });

    // Quick mode buttons
    document.getElementById('render-btn')?.addEventListener('click', () => {
      this.renderPreview();
    });

    document.getElementById('present-btn')?.addEventListener('click', () => {
      this.startPresentation();
    });

    document.getElementById('save-project-btn')?.addEventListener('click', () => {
      this.saveProject();
    });

    document.getElementById('export-btn')?.addEventListener('click', () => {
      this.showExportMenu();
    });

    document.getElementById('load-file-btn')?.addEventListener('click', () => {
      this.loadFile();
    });

    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Help
    document.getElementById('help-btn')?.addEventListener('click', () => {
      this.showHelp();
    });
  }

  /**
   * Handle state changes
   */
  private onStateChange(): void {
    // Re-render if needed
    // For now, we'll do a full re-render on state changes
    // In production, you'd want more granular updates
  }

  /**
   * Render preview
   */
  private renderPreview(): void {
    const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!editor) return;

    const markdown = editor.value;
    if (!markdown.trim()) {
      this.showToast('Please write some Markdown first', 'warning');
      return;
    }

    // TODO: Implement preview rendering
    this.showToast('Preview rendering not yet implemented', 'info');
  }

  /**
   * Start presentation
   */
  private startPresentation(): void {
    // TODO: Implement presentation mode
    this.showToast('Presentation mode not yet implemented', 'info');
  }

  /**
   * Save project
   */
  public saveProject(): void {
    const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!editor) return;

    const markdown = editor.value;

    const project: Project = {
      id: generateId('project'),
      name: 'My Presentation',
      mode: 'quick',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '2.0.0',
      slides: [],
      globalOptions: {},
    };

    // Validate project
    const validation = validateProject(project);
    if (!validation.valid) {
      this.showToast('Project validation failed', 'error');
      return;
    }

    // Save to localStorage
    try {
      localStorage.setItem('presentflow-last-project', JSON.stringify(project));
      localStorage.setItem('presentflow-last-markdown', markdown);
      this.showToast('Project saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save project:', error);
      this.showToast('Failed to save project', 'error');
    }
  }

  /**
   * Load last project
   */
  private loadLastProject(): void {
    try {
      const markdown = localStorage.getItem('presentflow-last-markdown');
      if (markdown) {
        const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
        if (editor) {
          editor.value = markdown;
        }
      }
    } catch (error) {
      console.error('Failed to load last project:', error);
    }
  }

  /**
   * Load file
   */
  private loadFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
        if (editor) {
          editor.value = text;
          this.showToast(`Loaded ${file.name}`, 'success');
        }
      } catch (error) {
        console.error('Failed to load file:', error);
        this.showToast('Failed to load file', 'error');
      }
    };
    input.click();
  }

  /**
   * Setup auto-save
   */
  private setupAutoSave(): void {
    const state = stateManager.getState();
    if (state.settings.autoSave) {
      setInterval(() => {
        this.saveProject();
      }, state.settings.autoSaveInterval);
    }
  }

  /**
   * Show export menu
   */
  private showExportMenu(): void {
    this.showToast('Export feature coming soon', 'info');
  }

  /**
   * Show settings
   */
  private showSettings(): void {
    this.showToast('Settings panel coming soon', 'info');
  }

  /**
   * Show help
   */
  private showHelp(): void {
    this.showToast('Help documentation coming soon', 'info');
  }

  /**
   * New project
   */
  public newProject(): void {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
      if (editor) {
        editor.value = '';
      }
      this.showToast('New project created', 'success');
    }
  }

  /**
   * Open project
   */
  public openProject(): void {
    this.loadFile();
  }

  /**
   * Exit presentation
   */
  public exitPresentation(): void {
    stateManager.updateUI({ isPresenting: false });
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  /**
   * Toggle fullscreen
   */
  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Show toast message
   */
  public showToast(message: string, type: ToastMessage['type'] = 'info'): void {
    const toast: ToastMessage = {
      id: generateId('toast'),
      type,
      message,
      duration: 3000,
    };

    this.toasts.set(toast.id, toast);

    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };

    const toastEl = document.createElement('div');
    toastEl.id = toast.id;
    toastEl.className = `glass-card p-4 flex items-center gap-3 animate-slide-in-right ${colors[type]}`;
    toastEl.innerHTML = `
      <span class="text-2xl">${icons[type]}</span>
      <span class="flex-1">${message}</span>
      <button class="btn-icon text-sm" onclick="document.getElementById('${toast.id}').remove()">×</button>
    `;

    container.appendChild(toastEl);

    if (toast.duration) {
      setTimeout(() => {
        toastEl.classList.add('opacity-0');
        setTimeout(() => {
          toastEl.remove();
          this.toasts.delete(toast.id);
        }, 300);
      }, toast.duration);
    }
  }

  /**
   * Show error
   */
  public showError(message: string): void {
    this.showToast(message, 'error');
  }
}
