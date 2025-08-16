/**
 * Connection Manager
 * Handles visual connections between nodes for presentation flow
 */

class ConnectionManager {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.nodeManager = options.nodeManager;
    this.onConnectionCreate = options.onConnectionCreate || (() => {});
    this.onConnectionDelete = options.onConnectionDelete || (() => {});
    this.onConnectionUpdate = options.onConnectionUpdate || (() => {});
    
    this.connections = new Map();
    this.isConnecting = false;
    this.connectionStart = null;
    this.tempConnection = null;
    this.connectionMode = false;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for connection mode toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.toggleConnectionMode();
      }
      
      if (e.key === 'Escape') {
        this.cancelConnection();
        this.exitConnectionMode();
      }
    });

    // Canvas click for connection creation
    this.canvas.getCanvas().addEventListener('click', (e) => {
      if (this.connectionMode) {
        this.handleConnectionClick(e);
      }
    });

    // Mouse move for temporary connection line
    this.canvas.getCanvas().addEventListener('mousemove', (e) => {
      if (this.isConnecting) {
        this.updateTempConnection(e);
      }
    });
  }

  toggleConnectionMode() {
    this.connectionMode = !this.connectionMode;
    this.updateConnectionModeUI();
    
    if (!this.connectionMode) {
      this.cancelConnection();
    }
  }

  updateConnectionModeUI() {
    const canvas = this.canvas.getCanvas();
    if (this.connectionMode) {
      canvas.style.cursor = 'crosshair';
      this.showConnectionModeNotification();
    } else {
      canvas.style.cursor = 'grab';
      this.hideConnectionModeNotification();
    }
  }

  showConnectionModeNotification() {
    const notification = document.createElement('div');
    notification.id = 'connection-mode-notification';
    notification.innerHTML = `
      <div class="connection-mode-content">
        <span>🔗 Connection Mode</span>
        <p>Click nodes to connect them • Press Escape to exit</p>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #007acc;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
  }

  hideConnectionModeNotification() {
    const notification = document.getElementById('connection-mode-notification');
    if (notification) {
      notification.remove();
    }
  }

  exitConnectionMode() {
    this.connectionMode = false;
    this.updateConnectionModeUI();
  }

  handleConnectionClick(e) {
    const mousePos = this.canvas.screenToWorld(
      e.clientX - this.canvas.getCanvas().getBoundingClientRect().left,
      e.clientY - this.canvas.getCanvas().getBoundingClientRect().top
    );

    // Find node at click position
    const clickedNode = this.findNodeAtPosition(mousePos.x, mousePos.y);
    
    if (clickedNode) {
      if (!this.isConnecting) {
        // Start new connection
        this.startConnection(clickedNode);
      } else {
        // Complete connection
        this.completeConnection(clickedNode);
      }
    } else if (this.isConnecting) {
      // Cancel connection if clicking on empty space
      this.cancelConnection();
    }
  }

  findNodeAtPosition(x, y) {
    const nodes = this.nodeManager.getNodes();
    
    for (const node of nodes) {
      const nodePos = node.position || { x: 0, y: 0 };
      const nodeSize = node.size || { width: 200, height: 150 };
      
      if (x >= nodePos.x && x <= nodePos.x + nodeSize.width &&
          y >= nodePos.y && y <= nodePos.y + nodeSize.height) {
        return node;
      }
    }
    
    return null;
  }

  startConnection(node) {
    this.isConnecting = true;
    this.connectionStart = node;
    
    // Visual feedback on start node
    this.highlightNode(node, 'connection-start');
  }

  completeConnection(endNode) {
    if (this.connectionStart && endNode && this.connectionStart.id !== endNode.id) {
      // Check if connection already exists
      const existingConnection = this.findConnection(this.connectionStart.id, endNode.id);
      
      if (!existingConnection) {
        const connection = this.createConnection(this.connectionStart, endNode);
        this.connections.set(connection.id, connection);
        this.onConnectionCreate(connection);
        
        // Visual feedback
        this.showConnectionCreatedFeedback(connection);
      } else {
        this.showConnectionExistsFeedback();
      }
    }
    
    this.cancelConnection();
  }

  cancelConnection() {
    this.isConnecting = false;
    this.clearTempConnection();
    
    if (this.connectionStart) {
      this.unhighlightNode(this.connectionStart);
      this.connectionStart = null;
    }
  }

  createConnection(startNode, endNode) {
    const connection = {
      id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startNodeId: startNode.id,
      endNodeId: endNode.id,
      type: 'flow',
      style: {
        color: '#007acc',
        width: 2,
        pattern: 'solid', // solid, dashed, dotted
        arrowStyle: 'arrow' // arrow, circle, none
      },
      metadata: {
        created: new Date().toISOString(),
        weight: 1
      }
    };

    return connection;
  }

  findConnection(startNodeId, endNodeId) {
    for (const connection of this.connections.values()) {
      if ((connection.startNodeId === startNodeId && connection.endNodeId === endNodeId) ||
          (connection.startNodeId === endNodeId && connection.endNodeId === startNodeId)) {
        return connection;
      }
    }
    return null;
  }

  deleteConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.onConnectionDelete(connection);
      return true;
    }
    return false;
  }

  updateTempConnection(e) {
    if (!this.isConnecting || !this.connectionStart) return;

    const mousePos = this.canvas.screenToWorld(
      e.clientX - this.canvas.getCanvas().getBoundingClientRect().left,
      e.clientY - this.canvas.getCanvas().getBoundingClientRect().top
    );

    this.renderTempConnection(this.connectionStart, mousePos);
  }

  renderTempConnection(startNode, endPos) {
    this.clearTempConnection();
    
    const startPos = this.getNodeConnectionPoint(startNode);
    this.tempConnection = {
      start: startPos,
      end: endPos,
      isTemp: true
    };
  }

  clearTempConnection() {
    this.tempConnection = null;
  }

  getNodeConnectionPoint(node, side = 'center') {
    const nodePos = node.position || { x: 0, y: 0 };
    const nodeSize = node.size || { width: 200, height: 150 };
    
    switch (side) {
      case 'top':
        return { x: nodePos.x + nodeSize.width / 2, y: nodePos.y };
      case 'right':
        return { x: nodePos.x + nodeSize.width, y: nodePos.y + nodeSize.height / 2 };
      case 'bottom':
        return { x: nodePos.x + nodeSize.width / 2, y: nodePos.y + nodeSize.height };
      case 'left':
        return { x: nodePos.x, y: nodePos.y + nodeSize.height / 2 };
      case 'center':
      default:
        return { x: nodePos.x + nodeSize.width / 2, y: nodePos.y + nodeSize.height / 2 };
    }
  }

  calculateOptimalConnectionPoints(startNode, endNode) {
    const startCenter = this.getNodeConnectionPoint(startNode, 'center');
    const endCenter = this.getNodeConnectionPoint(endNode, 'center');
    
    // Calculate angle between nodes
    const dx = endCenter.x - startCenter.x;
    const dy = endCenter.y - startCenter.y;
    const angle = Math.atan2(dy, dx);
    
    // Determine best connection points based on relative positions
    let startSide, endSide;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        startSide = 'right';
        endSide = 'left';
      } else {
        startSide = 'left';
        endSide = 'right';
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        startSide = 'bottom';
        endSide = 'top';
      } else {
        startSide = 'top';
        endSide = 'bottom';
      }
    }
    
    return {
      start: this.getNodeConnectionPoint(startNode, startSide),
      end: this.getNodeConnectionPoint(endNode, endSide)
    };
  }

  render() {
    const ctx = this.canvas.getContext();
    const viewport = this.canvas.getViewport();
    
    // Render all connections
    for (const connection of this.connections.values()) {
      this.renderConnection(ctx, connection, viewport);
    }
    
    // Render temporary connection
    if (this.tempConnection) {
      this.renderTempConnectionLine(ctx, this.tempConnection, viewport);
    }
  }

  renderConnection(ctx, connection, viewport) {
    const startNode = this.nodeManager.getNodeById(connection.startNodeId);
    const endNode = this.nodeManager.getNodeById(connection.endNodeId);
    
    if (!startNode || !endNode) return;
    
    const points = this.calculateOptimalConnectionPoints(startNode, endNode);
    const startScreen = this.canvas.worldToScreen(points.start.x, points.start.y);
    const endScreen = this.canvas.worldToScreen(points.end.x, points.end.y);
    
    // Check if connection is visible
    if (!this.isConnectionVisible(startScreen, endScreen, viewport)) return;
    
    ctx.save();
    
    // Set line style
    ctx.strokeStyle = connection.style.color;
    ctx.lineWidth = connection.style.width;
    
    if (connection.style.pattern === 'dashed') {
      ctx.setLineDash([5, 5]);
    } else if (connection.style.pattern === 'dotted') {
      ctx.setLineDash([2, 3]);
    }
    
    // Draw connection line
    this.drawConnectionLine(ctx, startScreen, endScreen);
    
    // Draw arrow
    if (connection.style.arrowStyle === 'arrow') {
      this.drawArrow(ctx, startScreen, endScreen);
    }
    
    ctx.restore();
  }

  renderTempConnectionLine(ctx, tempConnection, viewport) {
    const startScreen = this.canvas.worldToScreen(tempConnection.start.x, tempConnection.start.y);
    const endScreen = this.canvas.worldToScreen(tempConnection.end.x, tempConnection.end.y);
    
    ctx.save();
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.globalAlpha = 0.7;
    
    this.drawConnectionLine(ctx, startScreen, endScreen);
    
    ctx.restore();
  }

  drawConnectionLine(ctx, start, end) {
    // Use bezier curve for smooth connections
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offset (for curve)
    const offset = Math.min(distance * 0.3, 100);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal curve
      ctx.bezierCurveTo(
        start.x + offset, start.y,
        end.x - offset, end.y,
        end.x, end.y
      );
    } else {
      // Vertical curve
      ctx.bezierCurveTo(
        start.x, start.y + offset,
        end.x, end.y - offset,
        end.x, end.y
      );
    }
    
    ctx.stroke();
  }

  drawArrow(ctx, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - arrowAngle),
      end.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + arrowAngle),
      end.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  }

  isConnectionVisible(start, end, viewport) {
    // Simple bounds check - connection is visible if any part is in viewport
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    return !(maxX < 0 || minX > viewport.width || maxY < 0 || minY > viewport.height);
  }

  highlightNode(node, className = 'highlighted') {
    // Add visual highlight to node
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeElement) {
      nodeElement.classList.add(className);
    }
  }

  unhighlightNode(node, className = 'highlighted') {
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeElement) {
      nodeElement.classList.remove(className);
    }
  }

  showConnectionCreatedFeedback(connection) {
    console.log('Connection created:', connection.id);
    // Could add visual feedback here
  }

  showConnectionExistsFeedback() {
    console.log('Connection already exists');
    // Could show notification here
  }

  // Public API
  getConnections() {
    return Array.from(this.connections.values());
  }

  getConnectionsForNode(nodeId) {
    return this.getConnections().filter(conn => 
      conn.startNodeId === nodeId || conn.endNodeId === nodeId
    );
  }

  clearAllConnections() {
    this.connections.clear();
  }

  exportConnections() {
    return {
      connections: this.getConnections(),
      metadata: {
        count: this.connections.size,
        exported: new Date().toISOString()
      }
    };
  }

  importConnections(data) {
    if (data.connections) {
      this.clearAllConnections();
      data.connections.forEach(conn => {
        this.connections.set(conn.id, conn);
      });
    }
  }

  destroy() {
    this.clearAllConnections();
    this.cancelConnection();
    this.exitConnectionMode();
  }
}

export { ConnectionManager };