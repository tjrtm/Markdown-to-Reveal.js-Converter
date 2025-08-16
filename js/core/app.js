/**
 * Main Application Controller
 * Coordinates all modules and manages application state
 */

import { CanvasManager } from './canvas-manager.js';
import { NodeManager } from './node-manager.js';
import { StateManager } from './state-manager.js';
import { ConnectionManager } from './connection-manager.js';
import { PresentationEngine } from '../engines/presentation-engine.js';
import { TemplateManager } from './template-manager.js';
import { Toolbar } from '../components/toolbar.js';
import { PropertyPanel } from '../components/property-panel.js';
import { ModalEditor } from '../components/modal-editor.js';

class App {
  constructor() {
    this.state = new StateManager();
    this.canvas = null;
    this.nodes = null;
    this.connections = null;
    this.presentation = null;
    this.templates = null;
    this.ui = {};
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Starting app initialization...');
      
      // Initialize core systems
      console.log('📊 Initializing core systems...');
      await this.initializeCore();
      
      // Initialize UI components
      console.log('🎨 Initializing UI components...');
      await this.initializeUI();
      
      // Set up event listeners
      console.log('🎧 Setting up event listeners...');
      this.setupEventListeners();
      
      // Load any existing project data
      console.log('💾 Loading project data...');
      this.loadProjectData();
      
      // Show helpful instructions for new users
      this.showWelcomeInstructions();
      
      console.log('✅ Universal Presentation Builder initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  async initializeCore() {
    // Initialize canvas manager
    this.canvas = new CanvasManager({
      container: document.getElementById('canvas-container'),
      onViewportChange: (viewport) => this.handleViewportChange(viewport),
      onNodeSelect: (node) => this.handleNodeSelect(node)
    });

    // Initialize node manager
    this.nodes = new NodeManager({
      canvas: this.canvas,
      onNodeCreate: (node) => this.handleNodeCreate(node),
      onNodeUpdate: (node) => this.handleNodeUpdate(node),
      onNodeDelete: (nodeId) => this.handleNodeDelete(nodeId),
      onNodeSelect: (node) => this.handleNodeSelect(node)
    });

    // Initialize connection manager
    this.connections = new ConnectionManager({
      canvas: this.canvas,
      nodeManager: this.nodes,
      onConnectionCreate: (connection) => this.handleConnectionCreate(connection),
      onConnectionUpdate: (connection) => this.handleConnectionUpdate(connection),
      onConnectionDelete: (connection) => this.handleConnectionDelete(connection)
    });

    // Initialize presentation engine
    this.presentation = new PresentationEngine({
      nodes: this.nodes,
      onEngineChange: (engine) => this.handleEngineChange(engine)
    });

    // Initialize template manager
    this.templates = new TemplateManager({
      onTemplateApply: (templateData) => this.handleTemplateApply(templateData),
      onThemeChange: (theme) => this.handleThemeChange(theme)
    });
  }

  async initializeUI() {
    // Initialize toolbar
    this.ui.toolbar = new Toolbar({
      container: document.getElementById('toolbar-container'),
      onNodeTypeSelect: (type) => this.createNode(type),
      onZoomChange: (zoom, animate = false) => {
        if (zoom === 'fit') {
          this.fitToScreen();
        } else {
          this.canvas.setZoom(zoom, animate);
        }
      },
      onEngineSelect: (engine) => this.presentation.setEngine(engine)
    });

    // Initialize property panel
    this.ui.propertyPanel = new PropertyPanel({
      container: document.getElementById('property-panel'),
      onPropertyChange: (property, value) => this.updateSelectedNodeProperty(property, value)
    });

    // Initialize modal editor
    this.ui.modalEditor = new ModalEditor({
      onSave: (content) => this.saveNodeContent(content),
      onCancel: () => this.cancelNodeEdit()
    });

    // Set up global event listeners for UI
    this.setupGlobalEventListeners();
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Window resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Prevent default drag behavior
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  setupGlobalEventListeners() {
    // Listen for custom events from UI components
    window.addEventListener('start-presentation', () => this.startPresentation());
    window.addEventListener('export-presentation', () => this.exportPresentation());
    window.addEventListener('edit-node', (e) => {
      const node = e.detail?.node || this.state.get('selectedNode');
      if (node) {
        this.editNode(node);
      }
    });
    window.addEventListener('delete-node', (e) => this.deleteNode(e.detail.nodeId));
    window.addEventListener('show-engine-info', (e) => this.showEngineInfo(e.detail.currentEngine));
    window.addEventListener('show-templates', () => this.showTemplateGallery());
    window.addEventListener('apply-template', (e) => this.applyTemplate(e.detail.templateId));
    window.addEventListener('change-theme', (e) => this.changeTheme(e.detail.themeId));
    window.addEventListener('show-help', () => this.showInstructions());
  }

  // Event Handlers
  handleViewportChange(viewport) {
    this.state.set('viewport', viewport);
    if (this.ui.toolbar) {
      this.ui.toolbar.updateZoomDisplay(viewport.scale);
    }
  }

  handleNodeSelect(node) {
    this.state.set('selectedNode', node);
    this.ui.propertyPanel.showProperties(node);
  }

  handleNodeCreate(node) {
    // Add to state and sync back to nodes manager
    const stateNode = this.state.addNode(node);
    this.updatePresentation();
    return stateNode;
  }

  handleNodeUpdate(node) {
    // Update state and trigger re-render
    this.state.updateNode(node.id, node);
    this.updatePresentation();
    
    // Update property panel if this node is selected
    const selectedNode = this.state.get('selectedNode');
    if (selectedNode && selectedNode.id === node.id) {
      this.state.set('selectedNode', node);
      this.ui.propertyPanel.showProperties(node);
    }
  }

  handleNodeDelete(nodeId) {
    // Delete associated connections first
    const nodeConnections = this.connections.getConnectionsForNode(nodeId);
    nodeConnections.forEach(connection => {
      this.connections.deleteConnection(connection.id);
    });
    
    this.state.removeNode(nodeId);
    this.updatePresentation();
  }

  // Connection Event Handlers
  handleConnectionCreate(connection) {
    this.state.addConnection(connection);
    console.log('Connection created:', connection);
  }

  handleConnectionUpdate(connection) {
    this.state.updateConnection(connection.id, connection);
    console.log('Connection updated:', connection);
  }

  handleConnectionDelete(connection) {
    this.state.removeConnection(connection.id);
    console.log('Connection deleted:', connection);
  }

  handleEngineChange(engine) {
    this.state.set('presentationEngine', engine);
    this.updatePresentation();
  }

  // Template Event Handlers
  handleTemplateApply(templateData) {
    console.log('Applying template:', templateData.template.name);
    
    // Clear existing nodes
    const existingNodes = this.state.getNodes();
    existingNodes.forEach(node => this.nodes.deleteNode(node.id));
    
    // Add template nodes
    templateData.nodes.forEach(nodeData => {
      const node = this.nodes.createNode(nodeData);
      // Apply template-specific styling
      if (nodeData.style) {
        this.nodes.updateNode(node.id, { style: nodeData.style });
      }
    });
    
    // Add template connections
    if (templateData.connections && templateData.connections.length > 0) {
      templateData.connections.forEach(connectionData => {
        this.connections.createConnection(connectionData);
      });
    }
    
    // Fit to screen to show all template content
    setTimeout(() => this.fitToScreen(), 100);
    
    // Update presentation
    this.updatePresentation();
    
    // Show success notification
    this.showNotification(`Template "${templateData.template.name}" applied successfully!`, 'success');
  }

  handleThemeChange(theme) {
    console.log('Theme changed to:', theme.name);
    this.state.set('currentTheme', theme.id);
    this.showNotification(`Theme changed to "${theme.name}"`, 'info');
  }

  handleKeyDown(e) {
    // Global shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          this.createNode('text');
          break;
        case 's':
          e.preventDefault();
          this.saveProject();
          break;
        case 'o':
          e.preventDefault();
          this.openProject();
          break;
        case 'p':
          e.preventDefault();
          this.startPresentation();
          break;
        case 't':
          e.preventDefault();
          this.showTemplateGallery();
          break;
      }
    }

    // Delete key for selected nodes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedNode = this.state.get('selectedNode');
      if (selectedNode) {
        this.nodes.deleteNode(selectedNode.id);
      }
    }

    // Escape key
    if (e.key === 'Escape') {
      this.ui.modalEditor.close();
      this.nodes.deselectAll();
    }
  }

  handleResize() {
    this.canvas.resize();
  }

  // Application Methods
  createNode(type) {
    const viewport = this.canvas.getViewport();
    const centerX = -viewport.x + (viewport.width / 2) / viewport.scale;
    const centerY = -viewport.y + (viewport.height / 2) / viewport.scale;

    const nodeData = {
      type,
      position: { x: centerX, y: centerY },
      size: { width: 200, height: 150 }
    };

    // Create in node manager first
    const node = this.nodes.createNode(nodeData);
    
    // Select the new node
    this.nodes.selectNode(node);

    // Open editor for immediate content editing
    this.editNode(node);
  }

  editNode(node) {
    this.ui.modalEditor.open(node);
  }

  updateSelectedNodeProperty(property, value) {
    const selectedNode = this.state.get('selectedNode');
    if (selectedNode) {
      // Handle nested property paths like 'style.backgroundColor'
      const updates = {};
      const parts = property.split('.');
      let current = updates;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = current[parts[i]] || {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      
      this.nodes.updateNode(selectedNode.id, updates);
    }
  }

  deleteNode(nodeId) {
    if (nodeId) {
      this.nodes.deleteNode(nodeId);
    }
  }

  fitToScreen() {
    const bounds = this.nodes.getBounds();
    if (bounds.width > 0 && bounds.height > 0) {
      this.canvas.zoomToFit(bounds);
    }
  }

  exportPresentation() {
    // Placeholder for export functionality
    console.log('Export functionality not yet implemented');
  }

  saveNodeContent(content) {
    const selectedNode = this.state.get('selectedNode');
    if (selectedNode) {
      this.nodes.updateNode(selectedNode.id, { content });
      this.ui.modalEditor.close();
    }
  }

  cancelNodeEdit() {
    this.ui.modalEditor.close();
  }

  updatePresentation() {
    const nodes = this.state.getNodes();
    const connections = this.state.getConnections();
    const engine = this.state.get('presentationEngine', 'reveal');
    
    // Get engine recommendation if there are nodes
    if (nodes.length > 0) {
      const recommendation = this.presentation.getRecommendedEngine(nodes, connections);
      if (recommendation.engine !== engine) {
        // Show recommendation in toolbar
        this.ui.toolbar.showEngineRecommendation(recommendation);
      }
    }
    
    this.presentation.generatePresentation(nodes, engine, connections);
  }

  startPresentation() {
    const nodes = this.state.getNodes();
    if (nodes.length === 0) {
      this.showNotification('Add some nodes to create a presentation!', 'warning');
      return;
    }
    
    this.presentation.startPresentation();
  }

  // Project Management
  saveProject() {
    const projectData = {
      nodes: this.state.getNodes(),
      viewport: this.state.get('viewport'),
      engine: this.state.get('presentationEngine'),
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Save to localStorage for now
    localStorage.setItem('presentation-project', JSON.stringify(projectData));
    console.log('Project saved successfully');
  }

  loadProjectData() {
    try {
      const savedData = localStorage.getItem('presentation-project');
      if (savedData) {
        const projectData = JSON.parse(savedData);
        
        // Restore nodes
        if (projectData.nodes) {
          projectData.nodes.forEach(node => {
            this.nodes.createNode(node);
          });
        }

        // Restore viewport
        if (projectData.viewport) {
          this.canvas.setViewport(projectData.viewport);
        }

        // Restore engine
        if (projectData.engine) {
          this.presentation.setEngine(projectData.engine);
        }

        console.log('Project loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  }

  openProject() {
    // Future: implement file upload
    console.log('Project opening not yet implemented');
  }

  showEngineInfo(currentEngine) {
    const capabilities = this.presentation.getAllEngineCapabilities();
    const current = capabilities[currentEngine] || {};
    
    const infoHTML = `
      <div class="engine-info-modal">
        <div class="engine-info-content">
          <h2>Presentation Engine: ${current.name || currentEngine}</h2>
          <p class="engine-description">${current.description || 'No description available'}</p>
          
          <div class="engine-features">
            <h3>Features</h3>
            <ul>
              ${current.features?.themes ? `<li>Themes: ${current.features.themes.length} available</li>` : ''}
              ${current.features?.transitions ? `<li>Transitions: ${current.features.transitions.join(', ')}</li>` : ''}
              ${current.features?.exportFormats ? `<li>Export: ${current.features.exportFormats.join(', ')}</li>` : ''}
              ${current.features?.overview ? '<li>Overview mode supported</li>' : ''}
              ${current.features?.notes ? '<li>Speaker notes supported</li>' : ''}
              ${current.features?.fragments ? '<li>Fragment animations supported</li>' : ''}
            </ul>
          </div>
          
          <div class="engine-alternatives">
            <h3>Available Engines</h3>
            ${Object.entries(capabilities).map(([name, caps]) => `
              <div class="engine-option ${name === currentEngine ? 'current' : ''}" data-engine="${name}">
                <strong>${caps.name}</strong>
                <p>${caps.description}</p>
                ${name === currentEngine ? '<span class="current-badge">Current</span>' : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="engine-actions">
            <button class="modal-btn primary" onclick="this.closest('.engine-info-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.innerHTML = infoHTML;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Add click-to-close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const bgColor = {
      'warning': '#ff9800',
      'error': '#f44336',
      'success': '#4caf50',
      'info': '#2196f3'
    }[type] || '#4caf50';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1500;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Template Management Methods
  showTemplateGallery() {
    const templates = this.templates.getTemplates();
    const categories = this.templates.getTemplateCategories();
    const themes = this.templates.getThemes();
    const currentTheme = this.templates.getCurrentTheme();
    
    const categoryTabs = categories.map(cat => 
      `<button class="category-tab" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
    ).join('');
    
    const templateCards = (category) => {
      return this.templates.getTemplates(category).map(template => `
        <div class="template-card" data-template-id="${template.id}">
          <div class="template-icon">${template.thumbnail}</div>
          <div class="template-info">
            <h4>${template.name}</h4>
            <p>${template.description}</p>
            <div class="template-stats">
              ${template.nodes?.length || 0} nodes • ${template.connections?.length || 0} connections
            </div>
          </div>
          <button class="apply-template-btn" data-template-id="${template.id}">Apply</button>
        </div>
      `).join('');
    };
    
    const themeCards = themes.map(theme => `
      <div class="theme-card ${theme.id === currentTheme?.id ? 'active' : ''}" data-theme-id="${theme.id}">
        <div class="theme-preview" style="background: ${theme.colors.background}; color: ${theme.colors.text}; border: 1px solid ${theme.colors.border};">
          <div class="theme-sample" style="background: ${theme.colors.primary}; color: ${theme.colors.background};">Aa</div>
        </div>
        <div class="theme-info">
          <h5>${theme.name}</h5>
          <p>${theme.description}</p>
        </div>
        ${theme.id === currentTheme?.id ? '<span class="active-badge">Active</span>' : ''}
      </div>
    `).join('');
    
    const galleryHTML = `
      <div class="template-gallery-modal">
        <div class="template-gallery-content">
          <div class="gallery-header">
            <h2>📚 Template Gallery & Themes</h2>
            <button class="close-gallery-btn">&times;</button>
          </div>
          
          <div class="gallery-tabs">
            <button class="gallery-tab active" data-tab="templates">Templates</button>
            <button class="gallery-tab" data-tab="themes">Themes</button>
          </div>
          
          <div class="gallery-section templates-section">
            <div class="category-filters">
              <button class="category-tab active" data-category="">All</button>
              ${categoryTabs}
            </div>
            <div class="templates-grid" id="templates-grid">
              ${templateCards('')}
            </div>
          </div>
          
          <div class="gallery-section themes-section" style="display: none;">
            <div class="themes-grid">
              ${themeCards}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.innerHTML = galleryHTML;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Event listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('close-gallery-btn')) {
        modal.remove();
        return;
      }
      
      // Gallery tab switching
      if (e.target.classList.contains('gallery-tab')) {
        modal.querySelectorAll('.gallery-tab').forEach(tab => tab.classList.remove('active'));
        modal.querySelectorAll('.gallery-section').forEach(section => section.style.display = 'none');
        
        e.target.classList.add('active');
        const targetSection = e.target.dataset.tab + '-section';
        modal.querySelector(`.${targetSection}`).style.display = 'block';
        return;
      }
      
      // Category filtering
      if (e.target.classList.contains('category-tab')) {
        modal.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        const grid = modal.querySelector('#templates-grid');
        grid.innerHTML = templateCards(category);
        return;
      }
      
      // Template application
      if (e.target.classList.contains('apply-template-btn')) {
        const templateId = e.target.dataset.templateId;
        this.applyTemplate(templateId);
        modal.remove();
        return;
      }
      
      // Theme selection
      if (e.target.closest('.theme-card')) {
        const themeCard = e.target.closest('.theme-card');
        const themeId = themeCard.dataset.themeId;
        this.changeTheme(themeId);
        
        // Update active state
        modal.querySelectorAll('.theme-card').forEach(card => {
          card.classList.remove('active');
          const badge = card.querySelector('.active-badge');
          if (badge) badge.remove();
        });
        themeCard.classList.add('active');
        themeCard.insertAdjacentHTML('beforeend', '<span class="active-badge">Active</span>');
        return;
      }
    });
    
    document.body.appendChild(modal);
  }

  applyTemplate(templateId) {
    try {
      const templateData = this.templates.applyTemplate(templateId);
      console.log('Template applied:', templateData);
    } catch (error) {
      console.error('Failed to apply template:', error);
      this.showNotification('Failed to apply template: ' + error.message, 'error');
    }
  }

  changeTheme(themeId) {
    try {
      const theme = this.templates.applyTheme(themeId);
      console.log('Theme applied:', theme);
    } catch (error) {
      console.error('Failed to change theme:', error);
      this.showNotification('Failed to change theme: ' + error.message, 'error');
    }
  }

  showWelcomeInstructions() {
    // Check if user has seen instructions before
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
    if (hasSeenInstructions) return;

    const instructionsHTML = `
      <div class="welcome-modal">
        <div class="welcome-content">
          <div class="welcome-header">
            <h2>🚀 Welcome to Universal Presentation Builder</h2>
            <p>Create beautiful presentations with visual node flows</p>
          </div>
          
          <div class="welcome-instructions">
            <div class="instruction-section">
              <h3>🎯 Getting Started</h3>
              <div class="instruction-grid">
                <div class="instruction-item">
                  <div class="instruction-icon">📝</div>
                  <div class="instruction-text">
                    <h4>Add Nodes</h4>
                    <p>Click toolbar buttons or press <kbd>Ctrl+N</kbd> to add text, image, or code nodes</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">👆</div>
                  <div class="instruction-text">
                    <h4>Move Nodes</h4>
                    <p><strong>Click and drag</strong> any node to reposition it on the canvas</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">🔗</div>
                  <div class="instruction-text">
                    <h4>Connect Nodes</h4>
                    <p>Press <kbd>Ctrl+C</kbd> to enter connection mode, then <strong>click nodes</strong> to connect them</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">✏️</div>
                  <div class="instruction-text">
                    <h4>Edit Content</h4>
                    <p><strong>Double-click</strong> any node to open the full-screen editor</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="instruction-section">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <div class="shortcuts-grid">
                <div class="shortcut"><kbd>Ctrl+N</kbd> Add Text Node</div>
                <div class="shortcut"><kbd>Ctrl+C</kbd> Toggle Connection Mode</div>
                <div class="shortcut"><kbd>Ctrl+T</kbd> Open Templates</div>
                <div class="shortcut"><kbd>Ctrl+P</kbd> Start Presentation</div>
                <div class="shortcut"><kbd>Delete</kbd> Delete Selected Node</div>
                <div class="shortcut"><kbd>Escape</kbd> Cancel/Close</div>
              </div>
            </div>
            
            <div class="instruction-section">
              <h3>🎨 Advanced Features</h3>
              <ul class="features-list">
                <li><strong>Templates:</strong> Use pre-built templates for business, education, and marketing</li>
                <li><strong>Themes:</strong> Switch between Dark, Light, High Contrast, and Minimal themes</li>
                <li><strong>Multi-Engine:</strong> Export to Reveal.js or Impress.js based on your flow</li>
                <li><strong>Live Preview:</strong> See your presentation update in real-time</li>
              </ul>
            </div>
          </div>
          
          <div class="welcome-actions">
            <button class="welcome-btn secondary" id="skip-instructions">Skip</button>
            <button class="welcome-btn primary" id="start-tutorial">Got it, let's start!</button>
          </div>
        </div>
      </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.innerHTML = instructionsHTML;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;
    
    // Event listeners
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'skip-instructions' || e.target.id === 'start-tutorial') {
        localStorage.setItem('hasSeenInstructions', 'true');
        modal.remove();
        
        if (e.target.id === 'start-tutorial') {
          // Add a sample text node to get started
          setTimeout(() => {
            this.createNode('text');
            this.showNotification('🎉 Great! Try moving this node by clicking and dragging it', 'info');
          }, 500);
        }
      }
    });
    
    document.body.appendChild(modal);
  }

  showInstructions() {
    // Show instructions without localStorage check (for help button)
    const instructionsHTML = `
      <div class="welcome-modal">
        <div class="welcome-content">
          <div class="welcome-header">
            <h2>🎯 How to Use the Presentation Builder</h2>
            <p>Master node movement and connection creation</p>
          </div>
          
          <div class="welcome-instructions">
            <div class="instruction-section">
              <h3>🖱️ Node Movement & Management</h3>
              <div class="instruction-grid">
                <div class="instruction-item">
                  <div class="instruction-icon">👆</div>
                  <div class="instruction-text">
                    <h4>Move Nodes</h4>
                    <p><strong>Click and drag</strong> any node to reposition it anywhere on the infinite canvas</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">✏️</div>
                  <div class="instruction-text">
                    <h4>Edit Content</h4>
                    <p><strong>Double-click</strong> any node to open the full-screen editor with markdown support</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">🗑️</div>
                  <div class="instruction-text">
                    <h4>Delete Nodes</h4>
                    <p>Select a node and press <kbd>Delete</kbd> or <kbd>Backspace</kbd> to remove it</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">📝</div>
                  <div class="instruction-text">
                    <h4>Add Nodes</h4>
                    <p>Click toolbar buttons or press <kbd>Ctrl+N</kbd> to add text, image, or code nodes</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="instruction-section">
              <h3>🔗 Creating Node Connections</h3>
              <div class="instruction-grid">
                <div class="instruction-item">
                  <div class="instruction-icon">🎯</div>
                  <div class="instruction-text">
                    <h4>Enter Connection Mode</h4>
                    <p>Press <kbd>Ctrl+C</kbd> to toggle connection mode - you'll see a visual indicator</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">🔗</div>
                  <div class="instruction-text">
                    <h4>Connect Nodes</h4>
                    <p><strong>Click the first node</strong>, then <strong>click the second node</strong> to create a connection</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">👁️</div>
                  <div class="instruction-text">
                    <h4>Visual Feedback</h4>
                    <p>Nodes highlight when hovered, and connections show as curved lines with arrows</p>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">⚡</div>
                  <div class="instruction-text">
                    <h4>Exit Connection Mode</h4>
                    <p>Press <kbd>Escape</kbd> or <kbd>Ctrl+C</kbd> again to exit connection mode</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="instruction-section">
              <h3>⌨️ Essential Keyboard Shortcuts</h3>
              <div class="shortcuts-grid">
                <div class="shortcut"><kbd>Ctrl+N</kbd> Add Text Node</div>
                <div class="shortcut"><kbd>Ctrl+C</kbd> Toggle Connection Mode</div>
                <div class="shortcut"><kbd>Ctrl+T</kbd> Open Templates</div>
                <div class="shortcut"><kbd>Ctrl+P</kbd> Start Presentation</div>
                <div class="shortcut"><kbd>Delete</kbd> Delete Selected Node</div>
                <div class="shortcut"><kbd>Escape</kbd> Cancel/Close</div>
              </div>
            </div>
            
            <div class="instruction-section">
              <h3>🎨 Pro Tips</h3>
              <ul class="features-list">
                <li><strong>Flow-Based Presentations:</strong> Connect nodes to create logical presentation flows</li>
                <li><strong>Smart Engine Selection:</strong> The app recommends Reveal.js or Impress.js based on your connections</li>
                <li><strong>Templates:</strong> Use pre-built templates to get started quickly</li>
                <li><strong>Live Preview:</strong> Your presentation updates in real-time as you build</li>
              </ul>
            </div>
          </div>
          
          <div class="welcome-actions">
            <button class="welcome-btn primary" id="close-help">Got it!</button>
          </div>
        </div>
      </div>
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.innerHTML = instructionsHTML;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    `;
    
    // Event listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'close-help') {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
  }

  // Public API
  getState() {
    return this.state;
  }

  getCanvas() {
    return this.canvas;
  }

  getNodes() {
    return this.nodes;
  }

  getPresentation() {
    return this.presentation;
  }
}

// Export for module use
export { App };

// Global initialization for direct HTML usage
window.App = App;