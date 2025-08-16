/**
 * Presentation Engine
 * Abstract interface for multiple presentation libraries
 */

import { RevealEngine } from './reveal-engine.js';
import { ImpressEngine } from './impress-engine.js';

class PresentationEngine {
  constructor(options = {}) {
    this.nodes = options.nodes;
    this.onEngineChange = options.onEngineChange || (() => {});
    
    this.engines = new Map();
    this.currentEngine = null;
    this.currentEngineType = 'reveal';
    this.engineCapabilities = new Map();
    
    this.initializeEngines();
  }

  async initializeEngines() {
    // Register available engines with their capabilities
    this.registerEngine('reveal', RevealEngine);
    this.registerEngine('impress', ImpressEngine);
    
    // TODO: Add other engines when ready
    // this.registerEngine('spectacle', SpectacleEngine);
    // this.registerEngine('bespoke', BespokeEngine);
    
    // Set default engine
    await this.setEngine('reveal');
  }

  registerEngine(name, engineClass) {
    this.engines.set(name, engineClass);
    
    // Cache capabilities for faster access
    if (engineClass.getCapabilities) {
      this.engineCapabilities.set(name, engineClass.getCapabilities());
    }
  }

  async setEngine(engineType) {
    if (this.currentEngineType === engineType && this.currentEngine) {
      return;
    }

    const EngineClass = this.engines.get(engineType);
    if (!EngineClass) {
      throw new Error(`Unknown presentation engine: ${engineType}`);
    }

    // Cleanup current engine
    if (this.currentEngine) {
      await this.currentEngine.destroy();
    }

    // Initialize new engine
    this.currentEngine = new EngineClass({
      container: this.getPreviewContainer(),
      onReady: () => this.handleEngineReady(),
      onError: (error) => this.handleEngineError(error)
    });

    await this.currentEngine.initialize();
    
    this.currentEngineType = engineType;
    this.onEngineChange(engineType);
  }

  getPreviewContainer() {
    let container = document.getElementById('presentation-preview');
    if (!container) {
      container = document.createElement('div');
      container.id = 'presentation-preview';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 1000;
        display: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  async generatePresentation(nodes, engineType = null, connections = []) {
    if (engineType && engineType !== this.currentEngineType) {
      await this.setEngine(engineType);
    }

    if (!this.currentEngine) {
      throw new Error('No presentation engine available');
    }

    return this.currentEngine.generatePresentation(nodes, connections);
  }

  async startPresentation() {
    if (!this.currentEngine) {
      throw new Error('No presentation engine available');
    }

    return this.currentEngine.startPresentation();
  }

  async stopPresentation() {
    if (!this.currentEngine) {
      return;
    }

    return this.currentEngine.stopPresentation();
  }

  async exportPresentation(format = 'html') {
    if (!this.currentEngine) {
      throw new Error('No presentation engine available');
    }

    return this.currentEngine.exportPresentation(format);
  }

  // Event handlers
  handleEngineReady() {
    console.log(`${this.currentEngineType} engine ready`);
  }

  handleEngineError(error) {
    console.error(`Presentation engine error:`, error);
  }

  // Public API
  getCurrentEngine() {
    return this.currentEngineType;
  }

  getAvailableEngines() {
    return Array.from(this.engines.keys());
  }

  isEngineAvailable(engineType) {
    return this.engines.has(engineType);
  }

  getEngineCapabilities(engineType = null) {
    const type = engineType || this.currentEngineType;
    return this.engineCapabilities.get(type) || {};
  }

  getAllEngineCapabilities() {
    const capabilities = {};
    for (const [name, caps] of this.engineCapabilities) {
      capabilities[name] = caps;
    }
    return capabilities;
  }

  validateNodesForEngine(nodes, engineType = null) {
    const type = engineType || this.currentEngineType;
    const EngineClass = this.engines.get(type);
    
    if (!EngineClass) {
      return { isValid: false, issues: [`Unknown engine: ${type}`] };
    }

    // Create temporary instance to use validation method
    const tempEngine = new EngineClass({ container: document.createElement('div') });
    return tempEngine.validateNodes(nodes);
  }

  getRecommendedEngine(nodes, connections = []) {
    const engines = Array.from(this.engines.keys());
    let bestEngine = engines[0];
    let bestScore = 0;

    for (const engineType of engines) {
      const validation = this.validateNodesForEngine(nodes, engineType);
      const capabilities = this.getEngineCapabilities(engineType);
      
      let score = 0;
      
      // Base score for valid nodes
      if (validation.isValid) {
        score += 10;
      } else {
        score -= validation.issues.length;
      }
      
      // Bonus for advanced features
      if (capabilities.features?.overview) score += 2;
      if (capabilities.features?.fragments) score += 1;
      if (capabilities.features?.customCSS) score += 1;
      
      // Consider node types
      const nodeTypes = new Set(nodes.map(n => n.type));
      const supportedTypes = capabilities.features?.nodeTypes || [];
      const typeSupport = [...nodeTypes].filter(type => supportedTypes.includes(type)).length;
      score += typeSupport;

      // Connection-based scoring
      if (connections.length > 0) {
        // Create temporary engine instance to analyze connections
        const EngineClass = this.engines.get(engineType);
        if (EngineClass) {
          const tempEngine = new EngineClass({ container: document.createElement('div') });
          const flowAnalysis = tempEngine.analyzeConnectionFlow(nodes, connections);
          
          // Impress.js is better for spatial/complex flows
          if (engineType === 'impress' && (flowAnalysis.style === 'branching' || flowAnalysis.style === 'network')) {
            score += 5;
          }
          
          // Reveal.js is better for linear flows
          if (engineType === 'reveal' && flowAnalysis.style === 'linear') {
            score += 3;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestEngine = engineType;
      }
    }

    return {
      engine: bestEngine,
      score: bestScore,
      alternatives: engines.filter(e => e !== bestEngine),
      reason: connections.length > 0 ? 'connection-aware' : 'node-based'
    };
  }
}

export { PresentationEngine };