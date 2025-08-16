/**
 * State Manager
 * Manages application state with change notifications
 */

class StateManager {
  constructor() {
    this.state = {
      nodes: new Map(),
      connections: new Map(),
      selectedNode: null,
      selectedConnection: null,
      viewport: {
        x: 0,
        y: 0,
        scale: 1,
        width: 0,
        height: 0
      },
      presentationEngine: 'reveal',
      settings: {
        gridSize: 20,
        snapToGrid: true,
        theme: 'dark'
      }
    };

    this.listeners = new Map();
  }

  // Core state methods
  get(key, defaultValue = null) {
    return this.state[key] ?? defaultValue;
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notifyListeners(key, value, oldValue);
  }

  // Node management
  addNode(node) {
    const nodeId = node.id || this.generateId();
    const nodeWithId = { ...node, id: nodeId };
    this.state.nodes.set(nodeId, nodeWithId);
    this.notifyListeners('nodes', this.getNodes(), null);
    return nodeWithId;
  }

  updateNode(nodeId, updates) {
    const existingNode = this.state.nodes.get(nodeId);
    if (existingNode) {
      const updatedNode = { ...existingNode, ...updates };
      this.state.nodes.set(nodeId, updatedNode);
      this.notifyListeners('nodes', this.getNodes(), null);
      this.notifyListeners(`node:${nodeId}`, updatedNode, existingNode);
      return updatedNode;
    }
    return null;
  }

  removeNode(nodeId) {
    const node = this.state.nodes.get(nodeId);
    if (node) {
      this.state.nodes.delete(nodeId);
      
      // Clear selection if this node was selected
      if (this.state.selectedNode?.id === nodeId) {
        this.set('selectedNode', null);
      }
      
      this.notifyListeners('nodes', this.getNodes(), null);
      this.notifyListeners(`node:${nodeId}`, null, node);
      return true;
    }
    return false;
  }

  getNode(nodeId) {
    return this.state.nodes.get(nodeId);
  }

  getNodes() {
    return Array.from(this.state.nodes.values());
  }

  // Connection management
  addConnection(connection) {
    const connectionId = connection.id || this.generateId();
    const connectionWithId = { ...connection, id: connectionId };
    this.state.connections.set(connectionId, connectionWithId);
    this.notifyListeners('connections', this.getConnections(), null);
    return connectionWithId;
  }

  updateConnection(connectionId, updates) {
    const existingConnection = this.state.connections.get(connectionId);
    if (existingConnection) {
      const updatedConnection = { ...existingConnection, ...updates };
      this.state.connections.set(connectionId, updatedConnection);
      this.notifyListeners('connections', this.getConnections(), existingConnection);
      return updatedConnection;
    }
    return null;
  }

  removeConnection(connectionId) {
    const connection = this.state.connections.get(connectionId);
    if (connection) {
      this.state.connections.delete(connectionId);
      this.notifyListeners('connections', this.getConnections(), connection);
      return true;
    }
    return false;
  }

  getConnection(connectionId) {
    return this.state.connections.get(connectionId);
  }

  getConnections() {
    return Array.from(this.state.connections.values());
  }

  getConnectionsForNode(nodeId) {
    return this.getConnections().filter(conn => 
      conn.startNodeId === nodeId || conn.endNodeId === nodeId
    );
  }

  getNodesByType(type) {
    return this.getNodes().filter(node => node.type === type);
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, newValue, oldValue) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, event);
        } catch (error) {
          console.error(`Error in state listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Serialization
  serialize() {
    return {
      nodes: this.getNodes(),
      selectedNode: this.state.selectedNode,
      viewport: this.state.viewport,
      presentationEngine: this.state.presentationEngine,
      settings: this.state.settings
    };
  }

  deserialize(data) {
    if (data.nodes) {
      this.state.nodes.clear();
      data.nodes.forEach(node => {
        this.state.nodes.set(node.id, node);
      });
    }

    if (data.viewport) {
      this.state.viewport = { ...data.viewport };
    }

    if (data.presentationEngine) {
      this.state.presentationEngine = data.presentationEngine;
    }

    if (data.settings) {
      this.state.settings = { ...this.state.settings, ...data.settings };
    }

    // Notify all listeners that state has been restored
    this.notifyListeners('state:restored', data, null);
  }

  // Debug methods
  getStateSnapshot() {
    return JSON.parse(JSON.stringify(this.serialize()));
  }

  printState() {
    console.log('Current State:', this.getStateSnapshot());
  }
}

export { StateManager };