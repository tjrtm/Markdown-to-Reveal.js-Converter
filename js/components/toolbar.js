/**
 * Toolbar Component
 * Main toolbar with node creation and presentation controls
 */

class Toolbar {
  constructor(options = {}) {
    this.container = options.container;
    this.onNodeTypeSelect = options.onNodeTypeSelect || (() => {});
    this.onZoomChange = options.onZoomChange || (() => {});
    this.onEngineSelect = options.onEngineSelect || (() => {});
    
    this.currentZoom = 100;
    this.currentEngine = 'reveal';
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-section">
          <label class="toolbar-label">Nodes:</label>
          <button class="toolbar-btn" data-node-type="text" title="Add Text Node (Ctrl+N)">
            📝 Text
          </button>
          <button class="toolbar-btn" data-node-type="image" title="Add Image Node">
            🖼️ Image
          </button>
          <button class="toolbar-btn" data-node-type="code" title="Add Code Node">
            💻 Code
          </button>
        </div>
        
        <div class="toolbar-section">
          <label class="toolbar-label">Zoom:</label>
          <button class="toolbar-btn" id="zoom-out" title="Zoom Out">−</button>
          <span class="zoom-display" id="zoom-display">${this.currentZoom}%</span>
          <button class="toolbar-btn" id="zoom-in" title="Zoom In">+</button>
          <button class="toolbar-btn" id="zoom-fit" title="Fit to Screen">⌬</button>
        </div>
        
        <div class="toolbar-section">
          <label class="toolbar-label">Engine:</label>
          <select class="toolbar-select" id="engine-select">
            <option value="reveal">Reveal.js</option>
            <option value="impress">Impress.js</option>
            <option value="spectacle" disabled>Spectacle (soon)</option>
          </select>
          <button class="toolbar-btn" id="engine-info" title="Engine Information">ℹ️</button>
        </div>
        
        <div class="toolbar-section">
          <button class="toolbar-btn" id="show-templates" title="Template Gallery (Ctrl+T)">
            📚 Templates
          </button>
          <button class="toolbar-btn primary" id="start-presentation" title="Start Presentation (Ctrl+P)">
            ▶️ Present
          </button>
          <button class="toolbar-btn" id="export-presentation" title="Export Presentation">
            💾 Export
          </button>
          <button class="toolbar-btn" id="show-help" title="Show Instructions">
            ❓ Help
          </button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Node type buttons
    this.container.querySelectorAll('[data-node-type]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nodeType = e.target.dataset.nodeType;
        this.onNodeTypeSelect(nodeType);
        this.highlightButton(e.target);
      });
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.changeZoom(1.2);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.changeZoom(0.8);
    });

    document.getElementById('zoom-fit').addEventListener('click', () => {
      this.fitToScreen();
    });

    // Engine selection
    document.getElementById('engine-select').addEventListener('change', (e) => {
      this.currentEngine = e.target.value;
      this.onEngineSelect(this.currentEngine);
    });

    // Engine info button
    document.getElementById('engine-info').addEventListener('click', () => {
      this.showEngineInfo();
    });

    // Template gallery button
    document.getElementById('show-templates').addEventListener('click', () => {
      this.showTemplates();
    });

    // Help button
    document.getElementById('show-help').addEventListener('click', () => {
      this.showHelp();
    });

    // Presentation controls
    document.getElementById('start-presentation').addEventListener('click', () => {
      this.startPresentation();
    });

    document.getElementById('export-presentation').addEventListener('click', () => {
      this.exportPresentation();
    });
  }

  changeZoom(factor) {
    const newZoom = this.currentZoom * factor;
    const clampedZoom = Math.max(10, Math.min(1000, newZoom));
    
    if (clampedZoom !== this.currentZoom) {
      this.currentZoom = clampedZoom;
      this.updateZoomDisplay(clampedZoom / 100);
      this.onZoomChange(clampedZoom / 100, true); // Enable animation
    }
  }

  fitToScreen() {
    // This will be handled by the canvas manager
    this.onZoomChange('fit');
  }

  setZoomLevel(percentage) {
    this.currentZoom = percentage;
    this.updateZoomDisplay(percentage / 100);
  }

  updateZoomDisplay(scale) {
    const percentage = Math.round(scale * 100);
    this.currentZoom = percentage;
    
    const display = document.getElementById('zoom-display');
    if (display) {
      display.textContent = `${percentage}%`;
    }
  }

  highlightButton(button) {
    // Remove previous highlights
    this.container.querySelectorAll('.toolbar-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add highlight to clicked button
    button.classList.add('active');
    
    // Remove highlight after animation
    setTimeout(() => {
      button.classList.remove('active');
    }, 200);
  }

  startPresentation() {
    // This will be handled by the app
    window.dispatchEvent(new CustomEvent('start-presentation'));
  }

  exportPresentation() {
    // This will be handled by the app
    window.dispatchEvent(new CustomEvent('export-presentation'));
  }

  setEngine(engine) {
    this.currentEngine = engine;
    const select = document.getElementById('engine-select');
    if (select) {
      select.value = engine;
    }
  }

  enableEngine(engine, enabled = true) {
    const select = document.getElementById('engine-select');
    if (select) {
      const option = select.querySelector(`option[value="${engine}"]`);
      if (option) {
        option.disabled = !enabled;
      }
    }
  }

  showEngineInfo() {
    // This will trigger a custom event to show engine information
    window.dispatchEvent(new CustomEvent('show-engine-info', {
      detail: { currentEngine: this.currentEngine }
    }));
  }

  showTemplates() {
    // This will trigger a custom event to show template gallery
    window.dispatchEvent(new CustomEvent('show-templates'));
  }

  showHelp() {
    // This will trigger a custom event to show help instructions
    window.dispatchEvent(new CustomEvent('show-help'));
  }

  updateEngineOptions(engines) {
    const select = document.getElementById('engine-select');
    if (!select) return;

    // Clear current options
    select.innerHTML = '';

    // Add available engines
    engines.forEach(engine => {
      const option = document.createElement('option');
      option.value = engine.id;
      option.textContent = engine.name;
      option.disabled = !engine.available;
      if (engine.id === this.currentEngine) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  showEngineRecommendation(recommendation) {
    if (recommendation.engine !== this.currentEngine) {
      // Show a subtle notification about recommended engine
      const notification = document.createElement('div');
      notification.className = 'engine-recommendation';
      notification.innerHTML = `
        <span>💡 Recommended: ${recommendation.engine}</span>
        <button onclick="this.parentElement.remove()">×</button>
      `;
      notification.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: #007acc;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
      `;

      const engineSection = document.getElementById('engine-select').parentElement;
      engineSection.style.position = 'relative';
      engineSection.appendChild(notification);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 5000);
    }
  }
}

export { Toolbar };