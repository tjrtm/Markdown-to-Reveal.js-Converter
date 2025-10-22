/**
 * Global state management system
 */

import type { AppState, Project, Mode, Theme } from '@/types';
import { deepClone } from '@/utils/helpers';

type StateListener = (state: AppState) => void;

export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();
  private readonly STORAGE_KEY = 'presentflow-state';

  constructor(initialState?: Partial<AppState>) {
    this.state = this.createInitialState(initialState);
    this.loadFromStorage();
  }

  /**
   * Create initial state
   */
  private createInitialState(partial?: Partial<AppState>): AppState {
    const defaultState: AppState = {
      currentProject: null,
      mode: 'quick',
      theme: 'dark',
      selectedNodes: [],
      clipboard: [],
      history: {
        past: [],
        future: [],
      },
      ui: {
        sidebarOpen: true,
        propertiesPanelOpen: true,
        templateGalleryOpen: false,
        isPresenting: false,
        zoom: 100,
        pan: { x: 0, y: 0 },
      },
      settings: {
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        gridSnap: true,
        gridSize: 20,
        showGrid: true,
        defaultEngine: 'reveal',
        theme: 'dark',
      },
    };

    return { ...defaultState, ...partial };
  }

  /**
   * Get current state
   */
  getState(): AppState {
    return deepClone(this.state);
  }

  /**
   * Update state
   */
  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Update nested state
   */
  updateState<K extends keyof AppState>(key: K, value: Partial<AppState[K]>): void {
    const currentValue = this.state[key];
    if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
      this.state[key] = { ...currentValue, ...value } as AppState[K];
    } else {
      this.state[key] = value as AppState[K];
    }
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Set current project
   */
  setProject(project: Project | null): void {
    if (project && this.state.currentProject) {
      // Add current project to history
      this.addToHistory(this.state.currentProject);
    }

    this.setState({ currentProject: project });
  }

  /**
   * Update current project
   */
  updateProject(updates: Partial<Project>): void {
    if (!this.state.currentProject) return;

    const updatedProject: Project = {
      ...this.state.currentProject,
      ...updates,
      updatedAt: Date.now(),
    };

    this.setProject(updatedProject);
  }

  /**
   * Set mode
   */
  setMode(mode: Mode): void {
    this.setState({ mode });
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.setState({ theme });
    this.updateState('settings', { theme });

    // Update document class
    document.documentElement.classList.remove('dark', 'light');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(theme);
    }
  }

  /**
   * Select nodes
   */
  selectNodes(nodeIds: string[]): void {
    this.setState({ selectedNodes: nodeIds });
  }

  /**
   * Add node to selection
   */
  addToSelection(nodeId: string): void {
    if (!this.state.selectedNodes.includes(nodeId)) {
      this.setState({ selectedNodes: [...this.state.selectedNodes, nodeId] });
    }
  }

  /**
   * Remove node from selection
   */
  removeFromSelection(nodeId: string): void {
    this.setState({
      selectedNodes: this.state.selectedNodes.filter((id) => id !== nodeId),
    });
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.setState({ selectedNodes: [] });
  }

  /**
   * Set clipboard
   */
  setClipboard(nodes: AppState['clipboard']): void {
    this.setState({ clipboard: nodes });
  }

  /**
   * Add to history
   */
  private addToHistory(project: Project): void {
    const { past } = this.state.history;

    // Limit history size
    const maxHistory = 50;
    const newPast = [...past, project].slice(-maxHistory);

    this.setState({
      history: {
        past: newPast,
        future: [],
      },
    });
  }

  /**
   * Undo
   */
  undo(): void {
    const { past, future } = this.state.history;

    if (past.length === 0 || !this.state.currentProject) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    this.setState({
      currentProject: previous,
      history: {
        past: newPast,
        future: [this.state.currentProject, ...future],
      },
    });
  }

  /**
   * Redo
   */
  redo(): void {
    const { past, future } = this.state.history;

    if (future.length === 0 || !this.state.currentProject) return;

    const next = future[0];
    const newFuture = future.slice(1);

    this.setState({
      currentProject: next,
      history: {
        past: [...past, this.state.currentProject],
        future: newFuture,
      },
    });
  }

  /**
   * Update UI state
   */
  updateUI(updates: Partial<AppState['ui']>): void {
    this.updateState('ui', updates);
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<AppState['settings']>): void {
    this.updateState('settings', updates);
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify({
        theme: this.state.theme,
        settings: this.state.settings,
        ui: {
          sidebarOpen: this.state.ui.sidebarOpen,
          propertiesPanelOpen: this.state.ui.propertiesPanelOpen,
        },
      });
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem(this.STORAGE_KEY);
      if (serialized) {
        const loaded = JSON.parse(serialized);
        this.setState(loaded);
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = this.createInitialState();
    this.notifyListeners();
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export state
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import state
   */
  importState(stateJson: string): boolean {
    try {
      const imported = JSON.parse(stateJson);
      this.state = imported;
      this.notifyListeners();
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  }
}

// Export singleton instance
export const stateManager = new StateManager();
