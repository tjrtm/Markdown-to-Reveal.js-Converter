/**
 * Base Presentation Engine
 * Abstract base class defining the interface for all presentation engines
 */

class BaseEngine {
  constructor(options = {}) {
    this.container = options.container;
    this.onReady = options.onReady || (() => {});
    this.onError = options.onError || (() => {});
    this.onSlideChange = options.onSlideChange || (() => {});
    
    this.isInitialized = false;
    this.isPresenting = false;
    this.slides = [];
    this.currentSlide = 0;
    
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize the presentation engine
   * Must be implemented by subclasses
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Generate presentation from nodes
   * Must be implemented by subclasses
   */
  async generatePresentation(nodes, connections = []) {
    throw new Error('generatePresentation() must be implemented by subclass');
  }

  /**
   * Start the presentation
   * Must be implemented by subclasses
   */
  async startPresentation() {
    throw new Error('startPresentation() must be implemented by subclass');
  }

  /**
   * Stop the presentation
   * Must be implemented by subclasses
   */
  async stopPresentation() {
    throw new Error('stopPresentation() must be implemented by subclass');
  }

  /**
   * Export presentation to various formats
   * Must be implemented by subclasses
   */
  async exportPresentation(format = 'html') {
    throw new Error('exportPresentation() must be implemented by subclass');
  }

  /**
   * Destroy and cleanup the engine
   * Must be implemented by subclasses
   */
  async destroy() {
    throw new Error('destroy() must be implemented by subclass');
  }

  /**
   * Get default configuration for this engine
   * Should be overridden by subclasses
   */
  getDefaultConfig() {
    return {
      theme: 'dark',
      transition: 'slide',
      controls: true,
      progress: true,
      center: true,
      touch: true,
      keyboard: true,
      overview: true,
      loop: false,
      rtl: false,
      shuffle: false,
      fragments: true,
      fragmentInURL: false,
      embedded: false,
      help: true,
      showNotes: false,
      autoSlide: 0,
      autoSlideStoppable: true,
      autoSlideMethod: 'next',
      mouseWheel: false,
      hideInactiveCursor: true,
      hideCursorTime: 5000,
      previewLinks: false,
      postMessage: true,
      focusBodyOnLoad: true,
      width: 960,
      height: 700,
      margin: 0.04,
      minScale: 0.2,
      maxScale: 2.0
    };
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.applyConfig();
  }

  /**
   * Apply configuration to the engine
   * Should be overridden by subclasses
   */
  applyConfig() {
    // Base implementation does nothing
  }

  /**
   * Convert node to slide content
   * Should be overridden by subclasses for engine-specific formatting
   */
  convertNodeToSlide(node) {
    const slide = {
      id: node.id,
      type: node.type,
      content: this.generateSlideContent(node),
      background: node.style?.backgroundColor || 'transparent',
      transition: node.style?.transition || this.config.transition,
      position: node.position || { x: 0, y: 0 },
      size: node.size || { width: 960, height: 700 }
    };

    return slide;
  }

  /**
   * Generate HTML content for a slide based on node type
   */
  generateSlideContent(node) {
    switch (node.type) {
      case 'text':
        return this.generateTextContent(node.content);
      case 'image':
        return this.generateImageContent(node.content);
      case 'code':
        return this.generateCodeContent(node.content);
      default:
        return '<p>Unsupported node type</p>';
    }
  }

  /**
   * Generate text content with markdown support
   */
  generateTextContent(content) {
    if (!content?.text) {
      return '<p>Empty text node</p>';
    }

    // Simple markdown conversion
    let html = content.text
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<div class="text-content">${html}</div>`;
  }

  /**
   * Generate image content
   */
  generateImageContent(content) {
    if (!content?.imageUrl) {
      return '<p>No image source</p>';
    }

    const alt = content.alt || '';
    const caption = content.caption || '';
    const fitWidth = content.fitWidth ? 'width: 100%;' : '';
    const centerImage = content.centerImage ? 'margin: 0 auto; display: block;' : '';

    let html = `<img src="${content.imageUrl}" alt="${alt}" style="${fitWidth}${centerImage}">`;
    
    if (caption) {
      html += `<p class="image-caption">${caption}</p>`;
    }

    return `<div class="image-content">${html}</div>`;
  }

  /**
   * Generate code content with syntax highlighting
   */
  generateCodeContent(content) {
    if (!content?.code) {
      return '<p>Empty code block</p>';
    }

    const language = content.language || 'text';
    const code = this.escapeHtml(content.code);

    return `
      <div class="code-content">
        <pre><code class="language-${language}">${code}</code></pre>
      </div>
    `;
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sort nodes for presentation flow
   * Enhanced with connection-aware flow detection
   */
  sortNodesForPresentation(nodes, connections = []) {
    if (connections.length === 0) {
      // Fallback to position-based sorting
      return [...nodes].sort((a, b) => {
        const posA = a.position || { x: 0, y: 0 };
        const posB = b.position || { x: 0, y: 0 };
        
        // Sort by Y position first (top to bottom)
        if (Math.abs(posA.y - posB.y) > 50) {
          return posA.y - posB.y;
        }
        
        // Then by X position (left to right)
        return posA.x - posB.x;
      });
    }

    // Use connection-based flow detection
    return this.sortByConnectionFlow(nodes, connections);
  }

  /**
   * Sort nodes based on their connection flow
   * Creates a logical presentation order following connections
   */
  sortByConnectionFlow(nodes, connections) {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const visited = new Set();
    const result = [];

    // Build adjacency list from connections
    const adjacency = new Map();
    nodes.forEach(node => adjacency.set(node.id, []));
    
    connections.forEach(conn => {
      if (adjacency.has(conn.startNodeId)) {
        adjacency.get(conn.startNodeId).push(conn.endNodeId);
      }
    });

    // Find root nodes (nodes with no incoming connections)
    const incomingCount = new Map();
    nodes.forEach(node => incomingCount.set(node.id, 0));
    
    connections.forEach(conn => {
      if (incomingCount.has(conn.endNodeId)) {
        incomingCount.set(conn.endNodeId, incomingCount.get(conn.endNodeId) + 1);
      }
    });

    const rootNodes = nodes.filter(node => incomingCount.get(node.id) === 0);

    // Depth-first traversal starting from root nodes
    const dfs = (nodeId) => {
      if (visited.has(nodeId) || !nodeMap.has(nodeId)) return;
      
      visited.add(nodeId);
      result.push(nodeMap.get(nodeId));
      
      // Visit connected nodes
      const connectedNodes = adjacency.get(nodeId) || [];
      connectedNodes.forEach(connectedId => dfs(connectedId));
    };

    // Start from root nodes, sorted by position
    rootNodes
      .sort((a, b) => {
        const posA = a.position || { x: 0, y: 0 };
        const posB = b.position || { x: 0, y: 0 };
        return posA.x - posB.x || posA.y - posB.y;
      })
      .forEach(node => dfs(node.id));

    // Add any remaining unconnected nodes
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        result.push(node);
      }
    });

    return result;
  }

  /**
   * Analyze connection patterns to suggest presentation style
   */
  analyzeConnectionFlow(nodes, connections) {
    if (connections.length === 0) {
      return {
        style: 'spatial',
        complexity: 'simple',
        branching: false,
        loops: false
      };
    }

    const nodeCount = nodes.length;
    const connectionCount = connections.length;
    const density = connectionCount / Math.max(nodeCount - 1, 1);

    // Detect branching (nodes with multiple outgoing connections)
    const outgoingCount = new Map();
    connections.forEach(conn => {
      outgoingCount.set(conn.startNodeId, (outgoingCount.get(conn.startNodeId) || 0) + 1);
    });
    const hasBranching = Array.from(outgoingCount.values()).some(count => count > 1);

    // Detect potential loops (very simplified)
    const hasLoops = this.detectSimpleLoops(connections);

    let style = 'linear';
    if (density > 0.5 || hasBranching) {
      style = 'branching';
    }
    if (hasLoops || density > 1) {
      style = 'network';
    }

    return {
      style,
      complexity: density > 0.7 ? 'complex' : density > 0.3 ? 'moderate' : 'simple',
      branching: hasBranching,
      loops: hasLoops,
      density,
      stats: {
        nodes: nodeCount,
        connections: connectionCount,
        avgConnections: connectionCount / Math.max(nodeCount, 1)
      }
    };
  }

  /**
   * Simple loop detection in connection graph
   */
  detectSimpleLoops(connections) {
    const visited = new Set();
    const recursionStack = new Set();
    const adjacency = new Map();

    // Build adjacency list
    connections.forEach(conn => {
      if (!adjacency.has(conn.startNodeId)) {
        adjacency.set(conn.startNodeId, []);
      }
      adjacency.get(conn.startNodeId).push(conn.endNodeId);
    });

    const hasCycle = (node) => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    // Check all nodes for cycles
    for (const [startNode] of adjacency) {
      if (hasCycle(startNode)) return true;
    }

    return false;
  }

  /**
   * Get navigation state
   */
  getNavigationState() {
    return {
      currentSlide: this.currentSlide,
      totalSlides: this.slides.length,
      isFirst: this.currentSlide === 0,
      isLast: this.currentSlide === this.slides.length - 1,
      canGoNext: this.currentSlide < this.slides.length - 1,
      canGoPrev: this.currentSlide > 0
    };
  }

  /**
   * Navigate to specific slide
   */
  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
      this.onSlideChange(this.getNavigationState());
      return true;
    }
    return false;
  }

  /**
   * Navigate to next slide
   */
  nextSlide() {
    return this.goToSlide(this.currentSlide + 1);
  }

  /**
   * Navigate to previous slide
   */
  prevSlide() {
    return this.goToSlide(this.currentSlide - 1);
  }

  /**
   * Get static capabilities for this engine type
   * Should be implemented as a static method by subclasses
   */
  static getCapabilities() {
    return {
      name: 'Base Engine',
      description: 'Abstract base presentation engine',
      version: '1.0.0',
      features: {
        themes: ['default'],
        transitions: ['none', 'slide', 'fade'],
        exportFormats: ['html'],
        nodeTypes: ['text', 'image', 'code'],
        navigation: true,
        overview: false,
        notes: false,
        fragments: false,
        backgrounds: true,
        customCSS: false,
        plugins: []
      },
      requirements: {
        browser: 'modern',
        dependencies: [],
        cdn: []
      }
    };
  }

  /**
   * Load external dependencies
   */
  async loadDependencies(dependencies) {
    const promises = dependencies.map(dep => this.loadDependency(dep));
    return Promise.all(promises);
  }

  /**
   * Load a single dependency
   */
  async loadDependency(dependency) {
    return new Promise((resolve, reject) => {
      if (dependency.type === 'script') {
        const script = document.createElement('script');
        script.src = dependency.url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      } else if (dependency.type === 'css') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = dependency.url;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      } else {
        reject(new Error(`Unknown dependency type: ${dependency.type}`));
      }
    });
  }

  /**
   * Validate nodes for compatibility
   */
  validateNodes(nodes) {
    const capabilities = this.constructor.getCapabilities();
    const supportedTypes = capabilities.features.nodeTypes;
    
    const issues = [];
    
    nodes.forEach(node => {
      if (!supportedTypes.includes(node.type)) {
        issues.push({
          nodeId: node.id,
          type: 'unsupported_type',
          message: `Node type '${node.type}' is not supported by ${capabilities.name}`
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export { BaseEngine };