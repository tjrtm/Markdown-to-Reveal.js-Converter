/**
 * Unit tests for StateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '@/core/state/StateManager';
import type { Project } from '@/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('initialization', () => {
    it('should create initial state', () => {
      const state = stateManager.getState();

      expect(state).toBeDefined();
      expect(state.currentProject).toBeNull();
      expect(state.mode).toBe('quick');
      expect(state.theme).toBe('dark');
    });

    it('should accept partial initial state', () => {
      const manager = new StateManager({ mode: 'advanced' });
      const state = manager.getState();

      expect(state.mode).toBe('advanced');
    });
  });

  describe('state updates', () => {
    it('should update state', () => {
      stateManager.setState({ mode: 'advanced' });
      const state = stateManager.getState();

      expect(state.mode).toBe('advanced');
    });

    it('should update nested state', () => {
      stateManager.updateState('ui', { zoom: 150 });
      const state = stateManager.getState();

      expect(state.ui.zoom).toBe(150);
    });

    it('should notify listeners on update', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      stateManager.setState({ mode: 'advanced' });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('project management', () => {
    it('should set current project', () => {
      const project: Project = {
        id: 'test-1',
        name: 'Test',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };

      stateManager.setProject(project);
      const state = stateManager.getState();

      expect(state.currentProject).toEqual(project);
    });

    it('should update project', () => {
      const project: Project = {
        id: 'test-1',
        name: 'Test',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };

      stateManager.setProject(project);
      stateManager.updateProject({ name: 'Updated' });

      const state = stateManager.getState();
      expect(state.currentProject?.name).toBe('Updated');
    });
  });

  describe('theme management', () => {
    it('should set theme', () => {
      stateManager.setTheme('light');
      const state = stateManager.getState();

      expect(state.theme).toBe('light');
      expect(state.settings.theme).toBe('light');
    });
  });

  describe('selection management', () => {
    it('should select nodes', () => {
      stateManager.selectNodes(['node-1', 'node-2']);
      const state = stateManager.getState();

      expect(state.selectedNodes).toEqual(['node-1', 'node-2']);
    });

    it('should add to selection', () => {
      stateManager.selectNodes(['node-1']);
      stateManager.addToSelection('node-2');
      const state = stateManager.getState();

      expect(state.selectedNodes).toEqual(['node-1', 'node-2']);
    });

    it('should remove from selection', () => {
      stateManager.selectNodes(['node-1', 'node-2']);
      stateManager.removeFromSelection('node-1');
      const state = stateManager.getState();

      expect(state.selectedNodes).toEqual(['node-2']);
    });

    it('should clear selection', () => {
      stateManager.selectNodes(['node-1', 'node-2']);
      stateManager.clearSelection();
      const state = stateManager.getState();

      expect(state.selectedNodes).toEqual([]);
    });
  });

  describe('history management', () => {
    it('should add to history', () => {
      const project: Project = {
        id: 'test-1',
        name: 'Test',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };

      stateManager.setProject(project);

      const project2 = { ...project, name: 'Test 2' };
      stateManager.setProject(project2);

      const state = stateManager.getState();
      expect(state.history.past).toHaveLength(1);
    });

    it('should undo changes', () => {
      const project1: Project = {
        id: 'test-1',
        name: 'Test 1',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };

      const project2 = { ...project1, name: 'Test 2' };

      stateManager.setProject(project1);
      stateManager.setProject(project2);
      stateManager.undo();

      const state = stateManager.getState();
      expect(state.currentProject?.name).toBe('Test 1');
    });

    it('should redo changes', () => {
      const project1: Project = {
        id: 'test-1',
        name: 'Test 1',
        mode: 'quick',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '2.0.0',
        slides: [],
        globalOptions: {},
      };

      const project2 = { ...project1, name: 'Test 2' };

      stateManager.setProject(project1);
      stateManager.setProject(project2);
      stateManager.undo();
      stateManager.redo();

      const state = stateManager.getState();
      expect(state.currentProject?.name).toBe('Test 2');
    });
  });

  describe('subscriptions', () => {
    it('should subscribe to changes', () => {
      const listener = vi.fn();
      const unsubscribe = stateManager.subscribe(listener);

      stateManager.setState({ mode: 'advanced' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateManager.setState({ mode: 'quick' });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('should reset state', () => {
      stateManager.setState({ mode: 'advanced' });
      stateManager.reset();

      const state = stateManager.getState();
      expect(state.mode).toBe('quick');
    });
  });
});
