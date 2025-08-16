/**
 * Node Manager
 * Handles node creation, rendering, and interaction
 */

class NodeManager {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.onNodeCreate = options.onNodeCreate || (() => {});
    this.onNodeUpdate = options.onNodeUpdate || (() => {});
    this.onNodeDelete = options.onNodeDelete || (() => {});
    this.onNodeSelect = options.onNodeSelect || (() => {});
    
    this.nodes = new Map();
    this.selectedNode = null;
    this.hoveredNode = null;
    
    // Interaction state
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    
    this.setupEventListeners();
    
    // Start rendering loop
    this.startRenderLoop();
  }

  setupEventListeners() {
    const canvas = this.canvas.getCanvas();
    
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
  }

  // Node creation and management
  createNode(nodeData) {
    const node = {
      id: nodeData.id || this.generateId(),
      type: nodeData.type || 'text',
      position: nodeData.position || { x: 0, y: 0 },
      size: nodeData.size || { width: 200, height: 150 },
      content: nodeData.content || this.getDefaultContent(nodeData.type),
      style: nodeData.style || this.getDefaultStyle(nodeData.type),
      connections: nodeData.connections || { inputs: [], outputs: [] },
      metadata: nodeData.metadata || {}
    };

    this.nodes.set(node.id, node);
    this.onNodeCreate(node);
    this.render();
    
    return node;
  }

  updateNode(nodeId, updates) {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, updates);
      this.onNodeUpdate(node);
      this.render();
      return node;
    }
    return null;
  }

  deleteNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      
      // Clear selection if this node was selected
      if (this.selectedNode?.id === nodeId) {
        this.selectedNode = null;
      }
      
      this.onNodeDelete(nodeId);
      this.render();
      return true;
    }
    return false;
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  // Event handlers
  handleMouseDown(e) {
    const mousePos = this.canvas.getMousePos(e);
    const worldPos = this.canvas.screenToWorld(mousePos.x, mousePos.y);
    
    // Find clicked node
    const clickedNode = this.getNodeAtPosition(worldPos.x, worldPos.y);
    
    if (clickedNode) {
      // Select node
      this.selectNode(clickedNode);
      
      // Start dragging
      this.isDragging = true;
      this.dragOffset = {
        x: worldPos.x - clickedNode.position.x,
        y: worldPos.y - clickedNode.position.y
      };
      
      e.stopPropagation();
    } else {
      // Deselect all nodes
      this.deselectAll();
    }
    
    this.lastMousePos = mousePos;
  }

  handleMouseMove(e) {
    const mousePos = this.canvas.getMousePos(e);
    const worldPos = this.canvas.screenToWorld(mousePos.x, mousePos.y);
    
    if (this.isDragging && this.selectedNode) {
      // Drag selected node
      const newX = worldPos.x - this.dragOffset.x;
      const newY = worldPos.y - this.dragOffset.y;
      
      // Snap to grid if enabled
      const snapped = this.canvas.snapToGrid(newX, newY);
      
      this.updateNode(this.selectedNode.id, {
        position: { x: snapped.x, y: snapped.y }
      });
    } else {
      // Update hover state
      const hoveredNode = this.getNodeAtPosition(worldPos.x, worldPos.y);
      
      if (hoveredNode !== this.hoveredNode) {
        this.hoveredNode = hoveredNode;
        this.render();
      }
    }
    
    this.lastMousePos = mousePos;
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  handleDoubleClick(e) {
    const mousePos = this.canvas.getMousePos(e);
    const worldPos = this.canvas.screenToWorld(mousePos.x, mousePos.y);
    
    const clickedNode = this.getNodeAtPosition(worldPos.x, worldPos.y);
    if (clickedNode) {
      // Dispatch event for app to handle
      window.dispatchEvent(new CustomEvent('edit-node', { 
        detail: { node: clickedNode } 
      }));
    }
  }

  // Node interaction
  selectNode(node) {
    this.selectedNode = node;
    this.onNodeSelect(node);
    this.render();
  }

  deselectAll() {
    this.selectedNode = null;
    this.onNodeSelect(null);
    this.render();
  }

  editNode(node) {
    // This will be handled by the modal editor
    console.log('Edit node:', node.id);
  }

  getNodeAtPosition(x, y) {
    // Check nodes in reverse order (top to bottom)
    const nodes = this.getNodes().reverse();
    
    for (const node of nodes) {
      if (this.isPointInNode(x, y, node)) {
        return node;
      }
    }
    
    return null;
  }

  isPointInNode(x, y, node) {
    return x >= node.position.x &&
           x <= node.position.x + node.size.width &&
           y >= node.position.y &&
           y <= node.position.y + node.size.height;
  }

  // Rendering
  startRenderLoop() {
    const renderFrame = () => {
      this.render();
      // Also render connections if connection manager is available
      if (window.app && window.app.connections) {
        window.app.connections.render();
      }
      requestAnimationFrame(renderFrame);
    };
    requestAnimationFrame(renderFrame);
  }

  render() {
    if (!this.canvas || !this.canvas.getContext()) {
      return;
    }
    
    const ctx = this.canvas.getContext();
    const viewport = this.canvas.getViewport();
    
    // Clear canvas (grid will be rendered by CanvasManager)
    this.canvas.render();
    
    // Render all visible nodes
    for (const node of this.nodes.values()) {
      if (this.canvas.isRectVisible(
        node.position.x, 
        node.position.y, 
        node.size.width, 
        node.size.height
      )) {
        this.renderNode(node, ctx);
      }
    }
  }

  renderNode(node, ctx) {
    try {
      const screen = this.canvas.worldToScreen(node.position.x, node.position.y);
      const width = node.size.width * this.canvas.viewport.scale;
      const height = node.size.height * this.canvas.viewport.scale;
      
      // Skip rendering if too small
      if (width < 2 || height < 2) {
        return;
      }
      
      // Node background
      ctx.save();
      
      // Set styles based on state
      let backgroundColor = node.style?.backgroundColor || '#2a2a2a';
      let borderColor = node.style?.borderColor || '#555';
      let borderWidth = 2;
      
      if (node === this.selectedNode) {
        borderColor = '#007acc';
        borderWidth = 3;
      } else if (node === this.hoveredNode) {
        borderColor = '#666';
      }
      
      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(screen.x, screen.y, width, height);
      
      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(screen.x, screen.y, width, height);
      
      // Render simple content for now
      this.renderSimpleContent(node, ctx, screen, width, height);
      
      ctx.restore();
    } catch (error) {
      console.error('Error rendering node:', node.id, error);
    }
  }

  renderSimpleContent(node, ctx, screen, width, height) {
    // Simple text rendering
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = screen.x + width / 2;
    const centerY = screen.y + height / 2;
    
    let text = `${node.type} node`;
    if (node.content?.text) {
      text = node.content.text.substring(0, 20) + (node.content.text.length > 20 ? '...' : '');
    }
    
    ctx.fillText(text, centerX, centerY);
  }

  renderNodeContent(node, ctx, screen, width, height) {
    const padding = 10;
    const contentArea = {
      x: screen.x + padding,
      y: screen.y + 30, // Leave space for header
      width: width - padding * 2,
      height: height - 40
    };
    
    ctx.save();
    ctx.clip();
    
    switch (node.type) {
      case 'text':
        this.renderTextContent(node, ctx, contentArea);
        break;
      case 'image':
        this.renderImageContent(node, ctx, contentArea);
        break;
      case 'code':
        this.renderCodeContent(node, ctx, contentArea);
        break;
      default:
        this.renderDefaultContent(node, ctx, contentArea);
    }
    
    ctx.restore();
  }

  renderNodeHeader(node, ctx, screen, width) {
    const headerHeight = 25;
    
    // Header background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(screen.x, screen.y, width, headerHeight);
    
    // Title text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      node.metadata.title || this.getNodeTypeTitle(node.type),
      screen.x + 8,
      screen.y + headerHeight / 2
    );
  }

  renderTextContent(node, ctx, area) {
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'top';
    
    const text = node.content.text || 'Double-click to edit';
    const lines = this.wrapText(ctx, text, area.width);
    
    lines.forEach((line, index) => {
      const y = area.y + index * 18;
      if (y < area.y + area.height) {
        ctx.fillText(line, area.x, y);
      }
    });
  }

  renderImageContent(node, ctx, area) {
    if (node.content.imageUrl) {
      // TODO: Implement image rendering
      ctx.fillStyle = '#444';
      ctx.fillRect(area.x, area.y, area.width, area.height);
      
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image', area.x + area.width / 2, area.y + area.height / 2);
    } else {
      this.renderPlaceholder(ctx, area, 'Drop image here');
    }
  }

  renderCodeContent(node, ctx, area) {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(area.x, area.y, area.width, area.height);
    
    ctx.fillStyle = '#a8e6cf';
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';
    
    const code = node.content.code || '// Code here';
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const y = area.y + index * 16 + 5;
      if (y < area.y + area.height) {
        ctx.fillText(line, area.x + 5, y);
      }
    });
  }

  renderDefaultContent(node, ctx, area) {
    this.renderPlaceholder(ctx, area, `${node.type} node`);
  }

  renderPlaceholder(ctx, area, text) {
    ctx.fillStyle = '#333';
    ctx.fillRect(area.x, area.y, area.width, area.height);
    
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, area.x + area.width / 2, area.y + area.height / 2);
  }

  // Utility methods
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }

  getDefaultContent(type) {
    switch (type) {
      case 'text':
        return { text: 'Double-click to edit text' };
      case 'image':
        return { imageUrl: '', alt: '' };
      case 'code':
        return { code: '// Enter code here', language: 'javascript' };
      default:
        return {};
    }
  }

  getDefaultStyle(type) {
    return {
      backgroundColor: '#2a2a2a',
      borderColor: '#555',
      textColor: '#fff'
    };
  }

  getNodeTypeTitle(type) {
    const titles = {
      text: 'Text',
      image: 'Image',
      code: 'Code',
      media: 'Media'
    };
    return titles[type] || type;
  }

  generateId() {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  getSelectedNode() {
    return this.selectedNode;
  }

  getBounds() {
    if (this.nodes.size === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const node of this.nodes.values()) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.width);
      maxY = Math.max(maxY, node.position.y + node.size.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

export { NodeManager };