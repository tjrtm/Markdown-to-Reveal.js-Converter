/**
 * Impress.js Engine
 * Converts node-based presentations to Impress.js format
 * Focuses on spatial/3D presentation with infinite canvas
 */

import { BaseEngine } from './base-engine.js';

class ImpressEngine extends BaseEngine {
  constructor(options = {}) {
    super(options);
    
    this.impressInstance = null;
    this.canvasScale = 1000; // Scale factor for positioning
  }

  static getCapabilities() {
    return {
      name: 'Impress.js',
      description: 'Infinite canvas presentation with 3D effects and spatial navigation',
      version: '2.0.0',
      features: {
        themes: ['default', 'modern', 'classic'],
        transitions: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
        exportFormats: ['html'],
        nodeTypes: ['text', 'image', 'code'],
        navigation: true,
        overview: true,
        notes: false,
        fragments: false,
        backgrounds: true,
        customCSS: true,
        plugins: ['3d-transforms', 'spatial-navigation', 'zoom', 'rotate']
      },
      requirements: {
        browser: 'modern',
        dependencies: [
          {
            type: 'script',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.min.js',
            name: 'Impress.js Core'
          },
          {
            type: 'css',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.css',
            name: 'Impress.js CSS'
          }
        ],
        cdn: ['https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/']
      }
    };
  }

  getDefaultConfig() {
    return {
      ...super.getDefaultConfig(),
      transitionDuration: 1000,
      perspective: 1000,
      maxScale: 10,
      minScale: 0.1,
      autoplay: 0,
      keyboard: true,
      mouse: true,
      touch: true,
      spatial: true,
      theme: 'default'
    };
  }

  async initialize() {
    try {
      // Load dependencies
      const capabilities = this.constructor.getCapabilities();
      await this.loadDependencies(capabilities.requirements.dependencies);

      // Setup container
      this.setupContainer();
      
      this.isInitialized = true;
      this.onReady();
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  setupContainer() {
    this.container.innerHTML = `
      <div id="impress" class="impress-not-supported">
        <div class="fallback-message">
          <p>Your browser <b>doesn't support the features required</b> by impress.js, 
             so you are presented with a simplified version of this presentation.</p>
          <p>For the best experience please use the latest <b>Chrome</b>, <b>Safari</b> 
             or <b>Firefox</b> browser.</p>
        </div>
        <!-- Steps will be generated here -->
      </div>
    `;

    // Add Impress.js custom styles
    this.addImpressStyles();
  }

  addImpressStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .impress-enabled .step {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 10px;
        padding: 40px;
        color: #fff;
        text-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
        font-size: 30px;
        line-height: 1.36;
        letter-spacing: -1px;
        transition: opacity 1s;
      }

      .impress-enabled .step.active {
        opacity: 1;
      }

      .impress-enabled .step:not(.active) {
        opacity: 0.3;
      }

      .step h1, .step h2, .step h3 {
        margin-bottom: 0.5em;
      }

      .step pre {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 20px;
        overflow: auto;
        font-size: 0.8em;
      }

      .step img {
        max-width: 100%;
        max-height: 60vh;
        border-radius: 5px;
      }

      .step .image-caption {
        text-align: center;
        font-size: 0.7em;
        opacity: 0.8;
        margin-top: 10px;
      }

      .impress-on-overview .step {
        opacity: 1;
        cursor: pointer;
        transform-style: preserve-3d;
      }
    `;
    document.head.appendChild(style);
  }

  async generatePresentation(nodes, connections = []) {
    if (!this.isInitialized) {
      throw new Error('Impress.js engine not ready');
    }

    // Validate nodes
    const validation = this.validateNodes(nodes);
    if (!validation.isValid) {
      console.warn('Node validation issues:', validation.issues);
    }

    // Analyze connection flow for optimal 3D positioning
    const flowAnalysis = this.analyzeConnectionFlow(nodes, connections);
    console.log('Impress.js flow analysis:', flowAnalysis);

    // Convert nodes to steps with enhanced spatial positioning
    const sortedNodes = this.sortNodesForPresentation(nodes, connections);
    this.slides = sortedNodes.map((node, index) => this.convertNodeToSlide(node, index, connections));
    
    // Generate step HTML
    const stepsHTML = this.slides.map(slide => this.convertSlideToHTML(slide)).join('\n');
    
    // Update DOM
    const impressContainer = document.getElementById('impress');
    
    // Clear existing steps, keeping fallback message
    const existingSteps = impressContainer.querySelectorAll('.step');
    existingSteps.forEach(step => step.remove());
    
    // Add new steps
    impressContainer.insertAdjacentHTML('beforeend', stepsHTML);

    // Initialize or reinitialize Impress
    await this.initializeImpress();

    return {
      engine: 'impress',
      slideCount: this.slides.length,
      html: stepsHTML,
      flowAnalysis
    };
  }

  convertNodeToSlide(node, index, connections = []) {
    // Use base class to get basic slide structure
    const slide = super.convertNodeToSlide(node);
    
    // Add Impress.js specific spatial positioning with connection awareness
    const spatialData = this.calculateSpatialPosition(node, index, connections);
    slide.spatial = spatialData;
    
    return slide;
  }

  calculateSpatialPosition(node, index, connections = []) {
    // Convert canvas coordinates to 3D space
    const baseX = (node.position?.x || 0) * this.canvasScale / 200;
    const baseY = (node.position?.y || 0) * this.canvasScale / 200;
    
    // Connection-aware Z-positioning
    let zOffset = 0;
    let rotateX = 0, rotateY = 0, rotateZ = 0;
    
    if (connections.length > 0) {
      // Analyze node's role in the connection graph
      const nodeConnections = connections.filter(conn => 
        conn.startNodeId === node.id || conn.endNodeId === node.id
      );
      
      const outgoingConnections = connections.filter(conn => conn.startNodeId === node.id);
      const incomingConnections = connections.filter(conn => conn.endNodeId === node.id);
      
      // Root nodes (no incoming) go deeper
      if (incomingConnections.length === 0 && outgoingConnections.length > 0) {
        zOffset = -200;
        rotateX = -10;
      }
      // Leaf nodes (no outgoing) come forward
      else if (outgoingConnections.length === 0 && incomingConnections.length > 0) {
        zOffset = 200;
        rotateX = 10;
      }
      // Branching nodes get rotation
      else if (outgoingConnections.length > 1) {
        rotateY = 15;
        zOffset = -100;
      }
      // Hub nodes (many connections) get emphasis
      else if (nodeConnections.length > 2) {
        zOffset = 300;
        rotateZ = 5;
      }
    } else {
      // Fallback to variation-based positioning
      const variations = [
        { z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 },
        { z: -100, rotateX: 0, rotateY: -15, rotateZ: 0 },
        { z: 100, rotateX: 15, rotateY: 0, rotateZ: 5 },
        { z: 200, rotateX: -10, rotateY: 10, rotateZ: -3 },
        { z: -50, rotateX: 5, rotateY: -20, rotateZ: 2 }
      ];
      
      const variation = variations[index % variations.length];
      zOffset = variation.z;
      rotateX = variation.rotateX;
      rotateY = variation.rotateY;
      rotateZ = variation.rotateZ;
    }
    
    return {
      x: Math.round(baseX),
      y: Math.round(baseY),
      z: zOffset,
      rotateX,
      rotateY,
      rotateZ,
      scale: 1
    };
  }

  convertSlideToHTML(slide) {
    const spatialAttrs = this.generateSpatialAttributes(slide.spatial);
    return `<div class="step" ${spatialAttrs} data-slide-id="${slide.id}">${slide.content}</div>`;
  }

  generateSpatialAttributes(spatial) {
    const attrs = [];
    
    attrs.push(`data-x="${spatial.x}"`);
    attrs.push(`data-y="${spatial.y}"`);
    attrs.push(`data-z="${spatial.z}"`);
    
    if (spatial.rotateX !== 0) attrs.push(`data-rotate-x="${spatial.rotateX}"`);
    if (spatial.rotateY !== 0) attrs.push(`data-rotate-y="${spatial.rotateY}"`);
    if (spatial.rotateZ !== 0) attrs.push(`data-rotate-z="${spatial.rotateZ}"`);
    if (spatial.scale !== 1) attrs.push(`data-scale="${spatial.scale}"`);
    
    return attrs.join(' ');
  }

  async initializeImpress() {
    // Destroy existing instance
    if (this.impressInstance) {
      // Impress.js doesn't have a clean destroy method, so we reinitialize
      window.impress = undefined;
    }

    // Wait for DOM updates
    await new Promise(resolve => setTimeout(resolve, 50));

    // Initialize Impress.js
    if (typeof impress === 'function') {
      this.impressInstance = impress();
      this.impressInstance.init();
      
      // Set up event listeners
      this.setupImpressEventListeners();
    } else {
      throw new Error('Impress.js not available');
    }
  }

  setupImpressEventListeners() {
    // Listen for step changes
    document.addEventListener('impress:stepenter', (event) => {
      const stepElement = event.target;
      const slideId = stepElement.getAttribute('data-slide-id');
      const stepIndex = Array.from(document.querySelectorAll('.step')).indexOf(stepElement);
      
      this.currentSlide = stepIndex;
      this.onSlideChange(this.getNavigationState());
    });

    // Listen for overview mode
    document.addEventListener('impress:overview', () => {
      console.log('Overview mode activated');
    });

    document.addEventListener('impress:overview:hide', () => {
      console.log('Overview mode deactivated');
    });
  }

  async startPresentation() {
    if (!this.impressInstance) {
      throw new Error('Presentation not generated');
    }

    // Show presentation container
    this.container.style.display = 'block';
    
    // Start from first step
    this.impressInstance.goto(0);
    
    // Set up presentation controls
    this.setupPresentationControls();
    
    this.isPresenting = true;
  }

  async stopPresentation() {
    // Hide presentation container
    this.container.style.display = 'none';
    
    // Remove event listeners
    this.removePresentationControls();
    
    this.isPresenting = false;
  }

  setupPresentationControls() {
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.stopPresentation();
      }
    };
    
    document.addEventListener('keydown', this.handleKeyDown);
  }

  removePresentationControls() {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.handleKeyDown = null;
    }
  }

  // Navigation methods
  goToSlide(index) {
    if (this.impressInstance && index >= 0 && index < this.slides.length) {
      this.impressInstance.goto(index);
      return true;
    }
    return false;
  }

  nextSlide() {
    if (this.impressInstance) {
      this.impressInstance.next();
      return true;
    }
    return false;
  }

  prevSlide() {
    if (this.impressInstance) {
      this.impressInstance.prev();
      return true;
    }
    return false;
  }

  async exportPresentation(format = 'html') {
    if (!this.impressInstance) {
      throw new Error('Presentation not generated');
    }

    switch (format) {
      case 'html':
        return this.exportHTML();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportHTML() {
    const impressHTML = document.getElementById('impress').innerHTML;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Impress.js Presentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.css">
    <style>
      body {
        font-family: 'Arial', sans-serif;
        min-height: 740px;
        background: radial-gradient(rgb(240, 240, 240), rgb(190, 190, 190));
        background: -webkit-radial-gradient(rgb(240, 240, 240), rgb(190, 190, 190));
      }
      .step {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 10px;
        padding: 40px;
        color: #fff;
        text-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
        font-size: 30px;
        line-height: 1.36;
        letter-spacing: -1px;
      }
    </style>
</head>
<body>
    <div id="impress">
        ${impressHTML}
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/impress.js/2.0.0/impress.min.js"></script>
    <script>
        impress().init();
    </script>
</body>
</html>
    `.trim();
  }

  async destroy() {
    if (this.impressInstance) {
      // Impress.js doesn't have a standard destroy method
      window.impress = undefined;
      this.impressInstance = null;
    }
    
    this.removePresentationControls();
    this.isInitialized = false;
    this.isPresenting = false;
  }
}

export { ImpressEngine };