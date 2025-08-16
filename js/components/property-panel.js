/**
 * Property Panel Component
 * Shows and edits properties of selected nodes
 */

class PropertyPanel {
  constructor(options = {}) {
    this.container = options.container;
    this.onPropertyChange = options.onPropertyChange || (() => {});
    
    this.currentNode = null;
    
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="property-panel">
        <div class="property-header">
          <h3>Properties</h3>
        </div>
        <div class="property-content" id="property-content">
          <div class="no-selection">
            Select a node to edit its properties
          </div>
        </div>
      </div>
    `;
  }

  showProperties(node) {
    this.currentNode = node;
    this.renderNodeProperties();
  }

  renderNodeProperties() {
    if (!this.currentNode) {
      this.renderNoSelection();
      return;
    }

    const content = document.getElementById('property-content');
    content.innerHTML = `
      <div class="property-section">
        <h4>Node Information</h4>
        <div class="property-group">
          <label>Type:</label>
          <span class="property-value">${this.currentNode.type}</span>
        </div>
        <div class="property-group">
          <label>ID:</label>
          <span class="property-value">${this.currentNode.id}</span>
        </div>
      </div>

      <div class="property-section">
        <h4>Position & Size</h4>
        <div class="property-group">
          <label>X Position:</label>
          <input type="number" id="prop-x" value="${Math.round(this.currentNode.position.x)}" step="1">
        </div>
        <div class="property-group">
          <label>Y Position:</label>
          <input type="number" id="prop-y" value="${Math.round(this.currentNode.position.y)}" step="1">
        </div>
        <div class="property-group">
          <label>Width:</label>
          <input type="number" id="prop-width" value="${this.currentNode.size.width}" step="1" min="50">
        </div>
        <div class="property-group">
          <label>Height:</label>
          <input type="number" id="prop-height" value="${this.currentNode.size.height}" step="1" min="50">
        </div>
      </div>

      <div class="property-section">
        <h4>Appearance</h4>
        <div class="property-group">
          <label>Background Color:</label>
          <input type="color" id="prop-bg-color" value="${this.currentNode.style?.backgroundColor || '#2a2a2a'}">
        </div>
        <div class="property-group">
          <label>Border Color:</label>
          <input type="color" id="prop-border-color" value="${this.currentNode.style?.borderColor || '#555555'}">
        </div>
        <div class="property-group">
          <label>Text Color:</label>
          <input type="color" id="prop-text-color" value="${this.currentNode.style?.textColor || '#ffffff'}">
        </div>
      </div>

      ${this.renderTypeSpecificProperties()}

      <div class="property-section">
        <h4>Actions</h4>
        <button class="property-btn" id="edit-content">Edit Content</button>
        <button class="property-btn danger" id="delete-node">Delete Node</button>
      </div>
    `;

    this.setupPropertyEventListeners();
  }

  renderTypeSpecificProperties() {
    switch (this.currentNode.type) {
      case 'text':
        return this.renderTextProperties();
      case 'image':
        return this.renderImageProperties();
      case 'code':
        return this.renderCodeProperties();
      default:
        return '';
    }
  }

  renderTextProperties() {
    return `
      <div class="property-section">
        <h4>Text Properties</h4>
        <div class="property-group">
          <label>Font Size:</label>
          <input type="number" id="prop-font-size" value="${this.currentNode.style?.fontSize || 16}" min="8" max="72">
        </div>
        <div class="property-group">
          <label>Text Align:</label>
          <select id="prop-text-align">
            <option value="left" ${this.currentNode.style?.textAlign === 'left' ? 'selected' : ''}>Left</option>
            <option value="center" ${this.currentNode.style?.textAlign === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${this.currentNode.style?.textAlign === 'right' ? 'selected' : ''}>Right</option>
          </select>
        </div>
      </div>
    `;
  }

  renderImageProperties() {
    return `
      <div class="property-section">
        <h4>Image Properties</h4>
        <div class="property-group">
          <label>Image URL:</label>
          <input type="url" id="prop-image-url" value="${this.currentNode.content?.imageUrl || ''}" placeholder="https://...">
        </div>
        <div class="property-group">
          <label>Alt Text:</label>
          <input type="text" id="prop-alt-text" value="${this.currentNode.content?.alt || ''}" placeholder="Description">
        </div>
      </div>
    `;
  }

  renderCodeProperties() {
    return `
      <div class="property-section">
        <h4>Code Properties</h4>
        <div class="property-group">
          <label>Language:</label>
          <select id="prop-code-language">
            <option value="javascript" ${this.currentNode.content?.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
            <option value="python" ${this.currentNode.content?.language === 'python' ? 'selected' : ''}>Python</option>
            <option value="html" ${this.currentNode.content?.language === 'html' ? 'selected' : ''}>HTML</option>
            <option value="css" ${this.currentNode.content?.language === 'css' ? 'selected' : ''}>CSS</option>
            <option value="json" ${this.currentNode.content?.language === 'json' ? 'selected' : ''}>JSON</option>
            <option value="markdown" ${this.currentNode.content?.language === 'markdown' ? 'selected' : ''}>Markdown</option>
          </select>
        </div>
      </div>
    `;
  }

  setupPropertyEventListeners() {
    // Position & Size
    this.setupNumberInput('prop-x', 'position.x');
    this.setupNumberInput('prop-y', 'position.y');
    this.setupNumberInput('prop-width', 'size.width');
    this.setupNumberInput('prop-height', 'size.height');

    // Appearance
    this.setupColorInput('prop-bg-color', 'style.backgroundColor');
    this.setupColorInput('prop-border-color', 'style.borderColor');
    this.setupColorInput('prop-text-color', 'style.textColor');

    // Type-specific properties
    this.setupTypeSpecificListeners();

    // Actions
    const editBtn = document.getElementById('edit-content');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('edit-node', { 
          detail: { nodeId: this.currentNode.id } 
        }));
      });
    }

    const deleteBtn = document.getElementById('delete-node');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this node?')) {
          window.dispatchEvent(new CustomEvent('delete-node', { 
            detail: { nodeId: this.currentNode.id } 
          }));
        }
      });
    }
  }

  setupTypeSpecificListeners() {
    switch (this.currentNode.type) {
      case 'text':
        this.setupNumberInput('prop-font-size', 'style.fontSize');
        this.setupSelectInput('prop-text-align', 'style.textAlign');
        break;
      case 'image':
        this.setupTextInput('prop-image-url', 'content.imageUrl');
        this.setupTextInput('prop-alt-text', 'content.alt');
        break;
      case 'code':
        this.setupSelectInput('prop-code-language', 'content.language');
        break;
    }
  }

  setupNumberInput(elementId, propertyPath) {
    const input = document.getElementById(elementId);
    if (input) {
      input.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this.updateProperty(propertyPath, value);
        }
      });
    }
  }

  setupTextInput(elementId, propertyPath) {
    const input = document.getElementById(elementId);
    if (input) {
      input.addEventListener('change', (e) => {
        this.updateProperty(propertyPath, e.target.value);
      });
    }
  }

  setupColorInput(elementId, propertyPath) {
    const input = document.getElementById(elementId);
    if (input) {
      input.addEventListener('change', (e) => {
        this.updateProperty(propertyPath, e.target.value);
      });
    }
  }

  setupSelectInput(elementId, propertyPath) {
    const select = document.getElementById(elementId);
    if (select) {
      select.addEventListener('change', (e) => {
        this.updateProperty(propertyPath, e.target.value);
      });
    }
  }

  updateProperty(propertyPath, value) {
    if (!this.currentNode) return;

    const parts = propertyPath.split('.');
    let obj = this.currentNode;
    
    // Navigate to the parent object
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) {
        obj[parts[i]] = {};
      }
      obj = obj[parts[i]];
    }
    
    // Set the value
    obj[parts[parts.length - 1]] = value;
    
    // Notify of change
    this.onPropertyChange(propertyPath, value);
  }

  renderNoSelection() {
    const content = document.getElementById('property-content');
    content.innerHTML = `
      <div class="no-selection">
        Select a node to edit its properties
      </div>
    `;
  }

  clear() {
    this.currentNode = null;
    this.renderNoSelection();
  }
}

export { PropertyPanel };