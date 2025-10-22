/**
 * Main Application Class
 */

import { stateManager } from './core/state/StateManager';
import type { Project, ToastMessage, ExportFormat, Slide, TextAlignment, TransitionType } from './types';
import { generateId } from './utils/helpers';
import { validateProject } from './utils/validation';
import { RevealEngine } from './core/engines/RevealEngine';
import { ExportManager } from './core/export/ExportManager';
import { convertMarkdownToSlides } from './utils/markdown';

export class App {
  private container: HTMLElement;
  private toasts: Map<string, ToastMessage> = new Map();
  private revealEngine: RevealEngine;

  constructor() {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }
    this.container = app;
    this.revealEngine = new RevealEngine();
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

          <textarea id="markdown-editor" class="input-field flex-1 font-mono text-sm resize-none" placeholder="# Your Presentation Title

Start writing your presentation in Markdown..."></textarea>

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
    const state = stateManager.getState();
    return `
      <div class="flex-1 flex gap-4">
        <!-- Left Sidebar - Tools & Templates -->
        <div class="glass-card p-4 w-64 flex flex-col gap-4 overflow-y-auto" style="max-height: calc(100vh - 150px)">
          <div>
            <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
              🎨 Slide Types
            </h3>
            <div class="space-y-2">
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="title">
                <div class="flex items-center gap-2">
                  <span class="text-xl">📌</span>
                  <div>
                    <div class="font-semibold text-sm">Title Slide</div>
                    <div class="text-xs text-gray-400">Main title & subtitle</div>
                  </div>
                </div>
              </button>
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="content">
                <div class="flex items-center gap-2">
                  <span class="text-xl">📄</span>
                  <div>
                    <div class="font-semibold text-sm">Content Slide</div>
                    <div class="text-xs text-gray-400">Text & bullet points</div>
                  </div>
                </div>
              </button>
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="image">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🖼️</span>
                  <div>
                    <div class="font-semibold text-sm">Image Slide</div>
                    <div class="text-xs text-gray-400">Full image background</div>
                  </div>
                </div>
              </button>
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="code">
                <div class="flex items-center gap-2">
                  <span class="text-xl">💻</span>
                  <div>
                    <div class="font-semibold text-sm">Code Slide</div>
                    <div class="text-xs text-gray-400">Syntax highlighted code</div>
                  </div>
                </div>
              </button>
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="split">
                <div class="flex items-center gap-2">
                  <span class="text-xl">⚡</span>
                  <div>
                    <div class="font-semibold text-sm">Split Slide</div>
                    <div class="text-xs text-gray-400">Two column layout</div>
                  </div>
                </div>
              </button>
              <button class="add-slide-btn w-full text-left p-3 rounded-lg glass-card hover:bg-primary-500/20 transition-all" data-type="quote">
                <div class="flex items-center gap-2">
                  <span class="text-xl">💬</span>
                  <div>
                    <div class="font-semibold text-sm">Quote Slide</div>
                    <div class="text-xs text-gray-400">Highlighted quote</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <h3 class="text-sm font-semibold mb-3">🛠️ Tools</h3>
            <div class="space-y-2">
              <button id="tool-select" class="tool-btn w-full text-left p-2 rounded-lg glass-card hover:bg-primary-500/20 transition-all">
                <span class="text-lg mr-2">👆</span> Select
              </button>
              <button id="tool-pan" class="tool-btn w-full text-left p-2 rounded-lg glass-card hover:bg-primary-500/20 transition-all">
                <span class="text-lg mr-2">✋</span> Pan
              </button>
              <button id="tool-connect" class="tool-btn w-full text-left p-2 rounded-lg glass-card hover:bg-primary-500/20 transition-all">
                <span class="text-lg mr-2">🔗</span> Connect
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <h3 class="text-sm font-semibold mb-3">📊 View</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">Zoom</span>
                <span class="text-sm font-mono">${state.ui.zoom}%</span>
              </div>
              <input type="range" id="zoom-slider" min="25" max="200" value="${state.ui.zoom}" class="w-full">
              <div class="flex gap-2">
                <button id="zoom-fit" class="btn-secondary text-xs flex-1">Fit</button>
                <button id="zoom-reset" class="btn-secondary text-xs flex-1">100%</button>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div>
            <button id="advanced-export-btn" class="btn-neon w-full">
              📤 Export
            </button>
            <button id="advanced-preview-btn" class="btn-primary w-full mt-2">
              👁️ Preview
            </button>
          </div>
        </div>

        <!-- Center Canvas -->
        <div class="flex-1 glass-card p-4 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">🎨 Visual Canvas</h2>
            <div class="flex gap-2">
              <button id="undo-btn" class="btn-icon" title="Undo (Ctrl+Z)" ${state.history.past.length === 0 ? 'disabled' : ''}>
                ↶
              </button>
              <button id="redo-btn" class="btn-icon" title="Redo (Ctrl+Shift+Z)" ${state.history.future.length === 0 ? 'disabled' : ''}>
                ↷
              </button>
              <button id="delete-selected-btn" class="btn-icon" title="Delete (Del)">
                🗑️
              </button>
              <button id="duplicate-selected-btn" class="btn-icon" title="Duplicate (Ctrl+D)">
                📋
              </button>
            </div>
          </div>

          <div id="canvas-container" class="flex-1 relative overflow-hidden rounded-lg bg-slate-900/50" style="background-image: radial-gradient(circle, rgba(100, 100, 100, 0.1) 1px, transparent 1px); background-size: 20px 20px;">
            <div id="canvas" class="absolute w-full h-full" style="transform: scale(${state.ui.zoom / 100}) translate(${state.ui.pan.x}px, ${state.ui.pan.y}px); transform-origin: 0 0;">
              ${this.renderCanvasSlides()}
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between text-sm text-gray-400">
            <div>
              <span id="slide-count">0 slides</span> •
              <span id="selected-count">0 selected</span>
            </div>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="show-grid" ${state.settings.showGrid ? 'checked' : ''}>
                Show Grid
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" id="snap-to-grid" ${state.settings.gridSnap ? 'checked' : ''}>
                Snap to Grid
              </label>
            </div>
          </div>
        </div>

        <!-- Right Sidebar - Properties Panel -->
        ${state.ui.propertiesPanelOpen ? this.renderPropertiesPanel() : ''}
      </div>
    `;
  }

  /**
   * Render canvas slides
   */
  private renderCanvasSlides(): string {
    const state = stateManager.getState();
    const project = state.currentProject;

    if (!project || !project.slides || project.slides.length === 0) {
      return `
        <div class="absolute inset-0 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="text-4xl mb-2">👈</div>
            <p>Add a slide from the sidebar to get started</p>
          </div>
        </div>
      `;
    }

    return project.slides
      .map((slide, index) => {
        const x = (index % 4) * 320 + 50;
        const y = Math.floor(index / 4) * 220 + 50;
        const isSelected = state.selectedNodes.includes(slide.id);

        return `
          <div
            class="slide-node ${isSelected ? 'selected' : ''}"
            data-slide-id="${slide.id}"
            style="position: absolute; left: ${x}px; top: ${y}px; width: 280px;"
          >
            <div class="glass-card p-4 cursor-move hover:ring-2 hover:ring-primary-500 transition-all ${isSelected ? 'ring-2 ring-primary-500' : ''}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs bg-primary-500/20 px-2 py-1 rounded">#${index + 1}</span>
                  <span class="text-xs text-gray-400">${this.getSlideTypeIcon(slide)}</span>
                </div>
                <button class="btn-icon text-xs delete-slide" data-slide-id="${slide.id}">×</button>
              </div>
              <div class="bg-white/5 rounded p-3 min-h-[100px] text-sm overflow-hidden">
                ${this.renderSlidePreview(slide)}
              </div>
              <div class="mt-2 text-xs text-gray-400 truncate">
                ${slide.notes ? '📝 ' + slide.notes.substring(0, 30) + '...' : 'No notes'}
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Get slide type icon
   */
  private getSlideTypeIcon(slide: Slide): string {
    const content = slide.content.toLowerCase();
    if (content.includes('```')) return '💻 Code';
    if (content.startsWith('# ')) return '📌 Title';
    if (content.includes('![')) return '🖼️ Image';
    if (content.includes('>')) return '💬 Quote';
    return '📄 Content';
  }

  /**
   * Render slide preview
   */
  private renderSlidePreview(slide: Slide): string {
    const preview = slide.content
      .replace(/^#+ (.+)/gm, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/```[\s\S]*?```/g, '<code>...</code>')
      .split('\n')
      .slice(0, 3)
      .join('<br>');

    return preview || '<em class="text-gray-500">Empty slide</em>';
  }

  /**
   * Render properties panel
   */
  private renderPropertiesPanel(): string {
    const state = stateManager.getState();
    const selectedSlide = state.currentProject?.slides.find(
      s => state.selectedNodes.includes(s.id)
    );

    if (!selectedSlide) {
      return `
        <div class="glass-card p-4 w-64 overflow-y-auto" style="max-height: calc(100vh - 150px)">
          <h3 class="text-sm font-semibold mb-3">⚙️ Properties</h3>
          <div class="text-center text-gray-500 text-sm mt-8">
            <div class="text-2xl mb-2">👈</div>
            <p>Select a slide to edit its properties</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="glass-card p-4 w-64 overflow-y-auto" style="max-height: calc(100vh - 150px)">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold">⚙️ Properties</h3>
          <button id="close-properties" class="btn-icon text-xs">×</button>
        </div>

        <div class="space-y-4">
          <!-- Content Editor -->
          <div>
            <label class="text-xs text-gray-400 block mb-1">Content</label>
            <textarea
              id="slide-content-editor"
              class="input-field text-sm font-mono resize-none"
              rows="6"
              placeholder="Write markdown content..."
            >${selectedSlide.content}</textarea>
          </div>

          <!-- Speaker Notes -->
          <div>
            <label class="text-xs text-gray-400 block mb-1">Speaker Notes</label>
            <textarea
              id="slide-notes-editor"
              class="input-field text-sm resize-none"
              rows="3"
              placeholder="Add speaker notes..."
            >${selectedSlide.notes || ''}</textarea>
          </div>

          <div class="divider"></div>

          <!-- Slide Options -->
          <div>
            <label class="text-xs text-gray-400 block mb-1">Background Color</label>
            <input
              type="color"
              id="slide-bg-color"
              class="w-full h-8 rounded cursor-pointer"
              value="${selectedSlide.options?.backgroundColor || '#1e293b'}"
            >
          </div>

          <div>
            <label class="text-xs text-gray-400 block mb-1">Text Alignment</label>
            <select id="slide-text-align" class="input-field text-sm">
              <option value="left" ${selectedSlide.options?.textAlign === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${selectedSlide.options?.textAlign === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${selectedSlide.options?.textAlign === 'right' ? 'selected' : ''}>Right</option>
              <option value="justify" ${selectedSlide.options?.textAlign === 'justify' ? 'selected' : ''}>Justify</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-400 block mb-1">Transition</label>
            <select id="slide-transition-type" class="input-field text-sm">
              <option value="none" ${selectedSlide.options?.transition === 'none' ? 'selected' : ''}>None</option>
              <option value="fade" ${selectedSlide.options?.transition === 'fade' ? 'selected' : ''}>Fade</option>
              <option value="slide" ${selectedSlide.options?.transition === 'slide' ? 'selected' : ''}>Slide</option>
              <option value="convex" ${selectedSlide.options?.transition === 'convex' ? 'selected' : ''}>Convex</option>
              <option value="concave" ${selectedSlide.options?.transition === 'concave' ? 'selected' : ''}>Concave</option>
              <option value="zoom" ${selectedSlide.options?.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
            </select>
          </div>

          <div class="divider"></div>

          <button id="apply-slide-changes" class="btn-primary w-full">
            💾 Apply Changes
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

    // Advanced mode event listeners
    this.attachAdvancedModeListeners();
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
  private async renderPreview(): Promise<void> {
    const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!editor) return;

    const markdown = editor.value;
    if (!markdown.trim()) {
      this.showToast('Please write some Markdown first', 'warning');
      return;
    }

    try {
      const previewContainer = document.getElementById('preview-container');
      if (!previewContainer) {
        this.showToast('Preview container not found', 'error');
        return;
      }

      // Clear existing content
      previewContainer.innerHTML = '';

      // Initialize engine if needed
      await this.revealEngine.init(previewContainer);

      // Get slide options
      const transitionSelect = document.getElementById('slide-transition') as HTMLSelectElement;

      const options: import('@/types').SlideOptions = {
        transition: (transitionSelect?.value || 'slide') as import('@/types').TransitionType,
      };

      // Render markdown
      await this.revealEngine.renderMarkdown(markdown, options);

      this.showToast('Preview rendered successfully', 'success');
    } catch (error) {
      console.error('Failed to render preview:', error);
      this.showToast('Failed to render preview', 'error');
    }
  }

  /**
   * Start presentation
   */
  private async startPresentation(): Promise<void> {
    try {
      // Render preview first if needed
      await this.renderPreview();

      // Start presentation mode
      await this.revealEngine.startPresentation();

      stateManager.updateUI({ isPresenting: true });
      this.showToast('Presentation started! Press ESC to exit', 'success');
    } catch (error) {
      console.error('Failed to start presentation:', error);
      this.showToast('Failed to start presentation', 'error');
    }
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
      const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;

      if (editor) {
        if (markdown) {
          editor.value = markdown;
        } else {
          // Load default content
          editor.value = this.getDefaultMarkdown();
        }
      }
    } catch (error) {
      console.error('Failed to load last project:', error);
    }
  }

  /**
   * Get default markdown content
   */
  private getDefaultMarkdown(): string {
    return `# Welcome to PresentFlow Pro 🎭

A modern presentation builder with Markdown support

---

## Features ✨

- **Beautiful Themes** - Multiple professional themes
- **Live Preview** - See changes in real-time
- **Export Options** - HTML, PDF, and more
- **Full Markdown** - All standard Markdown syntax

---

## Getting Started 🚀

1. Write your content in Markdown
2. Separate slides with ---
3. Click "Render Preview"
4. Hit "Present" for fullscreen mode

---

## Example Slide

### Code Highlighting

${'```'}javascript
function hello() {
  console.log("Hello, World!");
}
${'```'}

---

## Lists & Formatting

- **Bold text**
- *Italic text*
- ~~Strikethrough~~

1. Numbered lists
2. Also work great
3. Very useful!

---

## Ready to Create?

Replace this content with your own presentation!

Press **ESC** to exit presentation mode.

Note: This is a speaker note - only visible to you!`;
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
    // Create modal for export options
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content p-8 max-w-md">
        <h2 class="text-2xl font-bold mb-4">Export Presentation</h2>
        <p class="text-gray-400 mb-6">Choose your export format:</p>

        <div class="space-y-3">
          <button class="export-option btn-secondary w-full text-left" data-format="html">
            <span class="text-2xl">🌐</span>
            <div class="ml-3">
              <div class="font-semibold">HTML (Standalone)</div>
              <div class="text-sm text-gray-400">Single file with all resources</div>
            </div>
          </button>

          <button class="export-option btn-secondary w-full text-left" data-format="pdf">
            <span class="text-2xl">📄</span>
            <div class="ml-3">
              <div class="font-semibold">PDF</div>
              <div class="text-sm text-gray-400">Print-friendly document</div>
            </div>
          </button>

          <button class="export-option btn-secondary w-full text-left" data-format="json">
            <span class="text-2xl">💾</span>
            <div class="ml-3">
              <div class="font-semibold">JSON Project</div>
              <div class="text-sm text-gray-400">Save and reload later</div>
            </div>
          </button>

          <button class="export-option btn-secondary w-full text-left" data-format="markdown">
            <span class="text-2xl">📝</span>
            <div class="ml-3">
              <div class="font-semibold">Markdown</div>
              <div class="text-sm text-gray-400">Plain text format</div>
            </div>
          </button>
        </div>

        <button class="btn-secondary w-full mt-6" onclick="this.closest('.modal-backdrop').remove()">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Add click handlers
    modal.querySelectorAll('.export-option').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const format = (btn as HTMLElement).dataset.format as ExportFormat;
        modal.remove();
        await this.exportPresentation(format);
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Export presentation
   */
  private async exportPresentation(format: ExportFormat): Promise<void> {
    try {
      const editor = document.getElementById('markdown-editor') as HTMLTextAreaElement;
      if (!editor) {
        this.showToast('Editor not found', 'error');
        return;
      }

      const markdown = editor.value;
      if (!markdown.trim()) {
        this.showToast('No content to export', 'warning');
        return;
      }

      // Create project from current content
      const slides = convertMarkdownToSlides(markdown);
      const transitionSelect = document.getElementById('slide-transition') as HTMLSelectElement;

      const project: Project = {
        id: generateId('project'),
        name: 'My Presentation',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides,
        globalOptions: {
          transition: (transitionSelect?.value || 'slide') as any,
        },
      };

      this.showToast(`Exporting as ${format.toUpperCase()}...`, 'info');

      await ExportManager.export(project, format, {
        includeNotes: true,
        quality: 'high',
      });

      this.showToast(`Exported successfully as ${format.toUpperCase()}!`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showToast('Export failed. Please try again.', 'error');
    }
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
  public async exitPresentation(): Promise<void> {
    stateManager.updateUI({ isPresenting: false });
    await this.revealEngine.exitPresentation();
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
   * Attach advanced mode event listeners
   */
  private attachAdvancedModeListeners(): void {
    const state = stateManager.getState();
    if (state.mode !== 'advanced') return;

    // Add slide buttons
    document.querySelectorAll('.add-slide-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type || 'content';
        this.addSlideToCanvas(type);
      });
    });

    // Canvas interactions
    const canvas = document.getElementById('canvas');
    if (canvas) {
      this.setupCanvasDragAndDrop(canvas);
    }

    // Slide node clicks
    document.querySelectorAll('.slide-node').forEach((node) => {
      node.addEventListener('click', (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const slideId = (node as HTMLElement).dataset.slideId;
        if (slideId) {
          this.selectSlide(slideId, mouseEvent.shiftKey);
        }
      });
    });

    // Delete slide buttons
    document.querySelectorAll('.delete-slide').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slideId = (btn as HTMLElement).dataset.slideId;
        if (slideId) {
          this.deleteSlide(slideId);
        }
      });
    });

    // Undo/Redo
    document.getElementById('undo-btn')?.addEventListener('click', () => {
      stateManager.undo();
      this.render();
    });

    document.getElementById('redo-btn')?.addEventListener('click', () => {
      stateManager.redo();
      this.render();
    });

    // Delete selected
    document.getElementById('delete-selected-btn')?.addEventListener('click', () => {
      this.deleteSelectedSlides();
    });

    // Duplicate selected
    document.getElementById('duplicate-selected-btn')?.addEventListener('click', () => {
      this.duplicateSelectedSlides();
    });

    // Zoom controls
    document.getElementById('zoom-slider')?.addEventListener('input', (e) => {
      const zoom = parseInt((e.target as HTMLInputElement).value);
      stateManager.updateUI({ zoom });
      this.updateCanvasTransform();
    });

    document.getElementById('zoom-fit')?.addEventListener('click', () => {
      stateManager.updateUI({ zoom: 100, pan: { x: 0, y: 0 } });
      this.updateCanvasTransform();
    });

    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      stateManager.updateUI({ zoom: 100 });
      this.updateCanvasTransform();
    });

    // Grid settings
    document.getElementById('show-grid')?.addEventListener('change', (e) => {
      const showGrid = (e.target as HTMLInputElement).checked;
      stateManager.updateSettings({ showGrid });
      this.render();
    });

    document.getElementById('snap-to-grid')?.addEventListener('change', (e) => {
      const gridSnap = (e.target as HTMLInputElement).checked;
      stateManager.updateSettings({ gridSnap });
    });

    // Properties panel
    document.getElementById('close-properties')?.addEventListener('click', () => {
      stateManager.updateUI({ propertiesPanelOpen: false });
      this.render();
    });

    document.getElementById('apply-slide-changes')?.addEventListener('click', () => {
      this.applySlideChanges();
    });

    // Export and preview
    document.getElementById('advanced-export-btn')?.addEventListener('click', () => {
      this.showExportMenu();
    });

    document.getElementById('advanced-preview-btn')?.addEventListener('click', () => {
      this.previewAdvancedPresentation();
    });

    // Keyboard shortcuts
    this.setupAdvancedKeyboardShortcuts();
  }

  /**
   * Add slide to canvas
   */
  private addSlideToCanvas(type: string): void {
    const state = stateManager.getState();
    let project = state.currentProject;

    if (!project) {
      // Create new project if none exists
      project = {
        id: generateId('project'),
        name: 'Untitled Presentation',
        mode: 'advanced',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };
    }

    const slideCount = project.slides.length;
    const newSlide: Slide = {
      id: generateId('slide'),
      content: this.getSlideTemplate(type),
      notes: '',
      order: slideCount,
      options: {
        backgroundColor: '#1e293b',
        textAlign: 'left',
        transition: 'slide',
      },
    };

    project.slides.push(newSlide);
    stateManager.setProject(project);
    this.render();
    this.showToast(`Added ${type} slide`, 'success');
  }

  /**
   * Get slide template by type
   */
  private getSlideTemplate(type: string): string {
    const templates: Record<string, string> = {
      title: '# Your Title\n\n## Subtitle\n\nYour Name',
      content: '## Slide Title\n\n- Point 1\n- Point 2\n- Point 3',
      image: '# Image Slide\n\n![Description](https://via.placeholder.com/800x600)',
      code: '## Code Example\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```',
      split: '## Split Layout\n\n:::: {.columns}\n\n::: {.column}\nLeft content\n:::\n\n::: {.column}\nRight content\n:::\n\n::::',
      quote: '# \n\n> "The best way to predict the future is to invent it."\n\n— Alan Kay',
    };

    return templates[type] || templates.content;
  }

  /**
   * Setup canvas drag and drop
   */
  private setupCanvasDragAndDrop(canvas: HTMLElement): void {
    let isDragging = false;
    let draggedSlideId: string | null = null;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    canvas.addEventListener('mousedown', (e) => {
      const target = (e.target as HTMLElement).closest('.slide-node') as HTMLElement;
      if (target) {
        isDragging = true;
        draggedSlideId = target.dataset.slideId || null;
        startX = e.clientX;
        startY = e.clientY;

        initialLeft = parseInt(target.style.left || '0');
        initialTop = parseInt(target.style.top || '0');

        target.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging && draggedSlideId) {
        const state = stateManager.getState();
        const zoom = state.ui.zoom / 100;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Snap to grid if enabled
        if (state.settings.gridSnap) {
          const gridSize = state.settings.gridSize;
          newLeft = Math.round(newLeft / gridSize) * gridSize;
          newTop = Math.round(newTop / gridSize) * gridSize;
        }

        const target = canvas.querySelector(`[data-slide-id="${draggedSlideId}"]`) as HTMLElement;
        if (target) {
          target.style.left = `${newLeft}px`;
          target.style.top = `${newTop}px`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging && draggedSlideId) {
        const target = canvas.querySelector(`[data-slide-id="${draggedSlideId}"]`) as HTMLElement;
        if (target) {
          target.style.cursor = 'move';
        }
        isDragging = false;
        draggedSlideId = null;
      }
    });
  }

  /**
   * Select slide
   */
  private selectSlide(slideId: string, multiSelect: boolean = false): void {
    const state = stateManager.getState();

    if (multiSelect) {
      if (state.selectedNodes.includes(slideId)) {
        stateManager.removeFromSelection(slideId);
      } else {
        stateManager.addToSelection(slideId);
      }
    } else {
      stateManager.selectNodes([slideId]);
    }

    // Open properties panel
    if (!state.ui.propertiesPanelOpen) {
      stateManager.updateUI({ propertiesPanelOpen: true });
    }

    this.render();
  }

  /**
   * Delete slide
   */
  private deleteSlide(slideId: string): void {
    if (!confirm('Delete this slide?')) return;

    const state = stateManager.getState();
    const project = state.currentProject;
    if (!project) return;

    project.slides = project.slides.filter((s) => s.id !== slideId);
    stateManager.setProject(project);
    stateManager.removeFromSelection(slideId);
    this.render();
    this.showToast('Slide deleted', 'success');
  }

  /**
   * Delete selected slides
   */
  private deleteSelectedSlides(): void {
    const state = stateManager.getState();
    if (state.selectedNodes.length === 0) {
      this.showToast('No slides selected', 'warning');
      return;
    }

    if (!confirm(`Delete ${state.selectedNodes.length} slide(s)?`)) return;

    const project = state.currentProject;
    if (!project) return;

    project.slides = project.slides.filter((s) => !state.selectedNodes.includes(s.id));
    stateManager.setProject(project);
    stateManager.clearSelection();
    this.render();
    this.showToast('Slides deleted', 'success');
  }

  /**
   * Duplicate selected slides
   */
  private duplicateSelectedSlides(): void {
    const state = stateManager.getState();
    if (state.selectedNodes.length === 0) {
      this.showToast('No slides selected', 'warning');
      return;
    }

    const project = state.currentProject;
    if (!project) return;

    const selectedSlides = project.slides.filter((s) => state.selectedNodes.includes(s.id));
    const duplicates = selectedSlides.map((slide) => ({
      ...slide,
      id: generateId('slide'),
      order: project.slides.length,
    }));

    project.slides.push(...duplicates);
    stateManager.setProject(project);
    this.render();
    this.showToast(`Duplicated ${duplicates.length} slide(s)`, 'success');
  }

  /**
   * Apply slide changes
   */
  private applySlideChanges(): void {
    const state = stateManager.getState();
    const project = state.currentProject;
    if (!project || state.selectedNodes.length === 0) return;

    const slideId = state.selectedNodes[0];
    const slide = project.slides.find((s) => s.id === slideId);
    if (!slide) return;

    const contentEditor = document.getElementById('slide-content-editor') as HTMLTextAreaElement;
    const notesEditor = document.getElementById('slide-notes-editor') as HTMLTextAreaElement;
    const bgColor = document.getElementById('slide-bg-color') as HTMLInputElement;
    const textAlign = document.getElementById('slide-text-align') as HTMLSelectElement;
    const transition = document.getElementById('slide-transition-type') as HTMLSelectElement;

    if (contentEditor) slide.content = contentEditor.value;
    if (notesEditor) slide.notes = notesEditor.value;

    if (!slide.options) slide.options = {};
    if (bgColor) slide.options.backgroundColor = bgColor.value;
    if (textAlign) slide.options.textAlign = textAlign.value as TextAlignment;
    if (transition) slide.options.transition = transition.value as TransitionType;

    stateManager.setProject(project);
    this.render();
    this.showToast('Changes applied', 'success');
  }

  /**
   * Update canvas transform
   */
  private updateCanvasTransform(): void {
    const state = stateManager.getState();
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const zoom = state.ui.zoom / 100;
    const pan = state.ui.pan;
    canvas.style.transform = `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`;
  }

  /**
   * Preview advanced presentation
   */
  private async previewAdvancedPresentation(): Promise<void> {
    const state = stateManager.getState();
    const project = state.currentProject;

    if (!project || project.slides.length === 0) {
      this.showToast('No slides to preview', 'warning');
      return;
    }

    // Convert slides to markdown
    const markdown = project.slides
      .sort((a, b) => a.order - b.order)
      .map((slide) => slide.content)
      .join('\n\n---\n\n');

    // Create a temporary container for preview
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content max-w-6xl h-[80vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold">🎬 Preview</h2>
          <button id="close-preview" class="btn-icon">×</button>
        </div>
        <div id="preview-reveal-container" class="flex-1 bg-black/30 rounded-lg"></div>
      </div>
    `;

    document.body.appendChild(modal);

    const container = modal.querySelector('#preview-reveal-container') as HTMLElement;
    await this.revealEngine.init(container);
    await this.revealEngine.renderMarkdown(markdown, project.globalOptions);

    modal.querySelector('#close-preview')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Setup advanced keyboard shortcuts
   */
  private setupAdvancedKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      const state = stateManager.getState();
      if (state.mode !== 'advanced') return;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedNodes.length > 0) {
          e.preventDefault();
          this.deleteSelectedSlides();
        }
      }

      // Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        stateManager.undo();
        this.render();
      }

      // Redo
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        stateManager.redo();
        this.render();
      }

      // Duplicate
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.duplicateSelectedSlides();
      }

      // Deselect all
      if (e.key === 'Escape') {
        stateManager.clearSelection();
        this.render();
      }
    });
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
