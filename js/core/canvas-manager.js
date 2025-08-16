/**
 * Canvas Manager
 * Handles infinite canvas with zoom, pan, and grid functionality
 */

class CanvasManager {
  constructor(options = {}) {
    this.container = options.container;
    this.onViewportChange = options.onViewportChange || (() => {});
    this.onNodeSelect = options.onNodeSelect || (() => {});
    
    // Canvas setup
    this.canvas = null;
    this.ctx = null;
    
    // Viewport state
    this.viewport = {
      x: 0,
      y: 0,
      scale: 1,
      width: 0,
      height: 0
    };
    
    // Interaction state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    
    // Grid settings
    this.gridSize = 20;
    this.showGrid = true;
    
    // Zoom settings
    this.minZoom = 0.1;   // 10%
    this.maxZoom = 10.0;  // 1000%
    this.zoomFactor = 1.1;
    this.targetScale = 1;
    this.isAnimating = false;
    
    this.init();
  }

  init() {
    this.createCanvas();
    this.setupEventListeners();
    this.resize();
    this.render();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      background: #1a1a1a;
    `;
    
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Prevent default drag behavior
    this.canvas.addEventListener('dragstart', (e) => e.preventDefault());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  // Event Handlers
  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStart = this.getMousePos(e);
    this.lastMousePos = this.dragStart;
    this.canvas.style.cursor = 'grabbing';
  }

  handleMouseMove(e) {
    this.lastMousePos = this.getMousePos(e);
    
    if (this.isDragging) {
      const deltaX = this.lastMousePos.x - this.dragStart.x;
      const deltaY = this.lastMousePos.y - this.dragStart.y;
      
      this.viewport.x += deltaX;
      this.viewport.y += deltaY;
      
      this.dragStart = this.lastMousePos;
      this.updateViewport();
      this.render();
    }
  }

  handleMouseUp(e) {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  handleWheel(e) {
    e.preventDefault();
    
    const mousePos = this.getMousePos(e);
    const worldPos = this.screenToWorld(mousePos.x, mousePos.y);
    
    // Zoom with smooth animation for better UX
    const zoomDirection = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = e.ctrlKey ? 1.05 : this.zoomFactor; // Finer control with Ctrl
    const newScale = this.clampZoom(this.viewport.scale * Math.pow(zoomFactor, zoomDirection));
    
    if (newScale !== this.viewport.scale) {
      // Instant zoom for responsiveness, animate for larger changes
      const shouldAnimate = Math.abs(newScale - this.viewport.scale) > 0.1;
      
      if (shouldAnimate && !this.isAnimating) {
        this.animateZoomToPoint(newScale, mousePos, worldPos);
      } else {
        // Zoom towards mouse position
        this.viewport.x = mousePos.x - worldPos.x * newScale;
        this.viewport.y = mousePos.y - worldPos.y * newScale;
        this.viewport.scale = newScale;
        
        this.updateViewport();
        this.render();
      }
    }
  }

  animateZoomToPoint(targetScale, screenPoint, worldPoint) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const startScale = this.viewport.scale;
    const startX = this.viewport.x;
    const startY = this.viewport.y;
    const startTime = performance.now();
    const duration = 200; // Shorter for wheel zoom
    
    const targetX = screenPoint.x - worldPoint.x * targetScale;
    const targetY = screenPoint.y - worldPoint.y * targetScale;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      this.viewport.scale = startScale + (targetScale - startScale) * easeProgress;
      this.viewport.x = startX + (targetX - startX) * easeProgress;
      this.viewport.y = startY + (targetY - startY) * easeProgress;
      
      this.updateViewport();
      this.render();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Touch events
  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.handleMouseUp(e);
  }

  handleKeyDown(e) {
    // Only handle if canvas has focus or no other element is focused
    if (document.activeElement && document.activeElement.tagName !== 'BODY') {
      return;
    }

    switch (e.key) {
      case '+':
      case '=':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.setZoom(this.viewport.scale * 1.2, true);
        }
        break;
      
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.setZoom(this.viewport.scale * 0.8, true);
        }
        break;
      
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.setZoom(1, true);
        }
        break;
      
      case 'g':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.toggleGrid();
        }
        break;
    }
  }

  // Coordinate transformations
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.viewport.x) / this.viewport.scale,
      y: (screenY - this.viewport.y) / this.viewport.scale
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX * this.viewport.scale + this.viewport.x,
      y: worldY * this.viewport.scale + this.viewport.y
    };
  }

  // Viewport management
  setViewport(viewport) {
    this.viewport = { ...this.viewport, ...viewport };
    this.updateViewport();
    this.render();
  }

  getViewport() {
    return { ...this.viewport };
  }

  updateViewport() {
    this.onViewportChange(this.viewport);
  }

  setZoom(scale, animate = false, focusPoint = null) {
    const targetScale = this.clampZoom(scale);
    
    if (animate && !this.isAnimating) {
      this.animateZoom(targetScale, focusPoint);
    } else {
      const centerX = focusPoint?.x || this.viewport.width / 2;
      const centerY = focusPoint?.y || this.viewport.height / 2;
      const worldCenter = this.screenToWorld(centerX, centerY);
      
      this.viewport.scale = targetScale;
      this.viewport.x = centerX - worldCenter.x * this.viewport.scale;
      this.viewport.y = centerY - worldCenter.y * this.viewport.scale;
      
      this.updateViewport();
      this.render();
    }
  }

  animateZoom(targetScale, focusPoint = null) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const startScale = this.viewport.scale;
    const startTime = performance.now();
    const duration = 300; // 300ms animation
    
    const centerX = focusPoint?.x || this.viewport.width / 2;
    const centerY = focusPoint?.y || this.viewport.height / 2;
    const worldCenter = this.screenToWorld(centerX, centerY);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentScale = startScale + (targetScale - startScale) * easeProgress;
      
      this.viewport.scale = currentScale;
      this.viewport.x = centerX - worldCenter.x * this.viewport.scale;
      this.viewport.y = centerY - worldCenter.y * this.viewport.scale;
      
      this.updateViewport();
      this.render();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
      }
    };
    
    requestAnimationFrame(animate);
  }

  clampZoom(scale) {
    return Math.max(this.minZoom, Math.min(this.maxZoom, scale));
  }

  zoomToFit(bounds) {
    const padding = 50;
    const scaleX = (this.viewport.width - padding * 2) / bounds.width;
    const scaleY = (this.viewport.height - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    this.viewport.scale = this.clampZoom(scale);
    this.viewport.x = (this.viewport.width - bounds.width * scale) / 2 - bounds.x * scale;
    this.viewport.y = (this.viewport.height - bounds.height * scale) / 2 - bounds.y * scale;
    
    this.updateViewport();
    this.render();
  }

  // Grid functionality
  setGridSize(size) {
    this.gridSize = size;
    this.render();
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.render();
  }

  snapToGrid(x, y, snapEnabled = true) {
    if (!snapEnabled) {
      return { x, y };
    }
    
    const threshold = this.gridSize * 0.3; // Snap within 30% of grid size
    const gridX = Math.round(x / this.gridSize) * this.gridSize;
    const gridY = Math.round(y / this.gridSize) * this.gridSize;
    
    const snapX = Math.abs(x - gridX) < threshold ? gridX : x;
    const snapY = Math.abs(y - gridY) < threshold ? gridY : y;
    
    return { x: snapX, y: snapY };
  }

  getSnapIndicators(x, y) {
    const gridX = Math.round(x / this.gridSize) * this.gridSize;
    const gridY = Math.round(y / this.gridSize) * this.gridSize;
    
    const threshold = this.gridSize * 0.3;
    const snapX = Math.abs(x - gridX) < threshold;
    const snapY = Math.abs(y - gridY) < threshold;
    
    return {
      snapX,
      snapY,
      targetX: gridX,
      targetY: gridY
    };
  }

  // Rendering
  render() {
    this.clear();
    
    if (this.showGrid) {
      this.renderGrid();
    }
    
    // Nodes will be rendered by NodeManager
  }

  clear() {
    this.ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
  }

  renderGrid() {
    const gridSize = this.gridSize * this.viewport.scale;
    
    // Only render if grid is visible (not too small or too large)
    if (gridSize < 5 || gridSize > 200) return;
    
    // Adaptive grid opacity based on zoom level
    const opacity = Math.min(1, Math.max(0.1, (gridSize - 5) / 50));
    this.ctx.strokeStyle = `rgba(51, 51, 51, ${opacity})`;
    this.ctx.lineWidth = gridSize > 50 ? 2 : 1;
    this.ctx.beginPath();
    
    // Calculate grid bounds with padding
    const padding = gridSize * 2;
    const startX = Math.floor((-this.viewport.x - padding) / gridSize) * gridSize;
    const startY = Math.floor((-this.viewport.y - padding) / gridSize) * gridSize;
    const endX = startX + this.viewport.width + padding * 2;
    const endY = startY + this.viewport.height + padding * 2;
    
    // Limit number of lines for performance
    const maxLines = 100;
    const stepX = Math.max(gridSize, (endX - startX) / maxLines);
    const stepY = Math.max(gridSize, (endY - startY) / maxLines);
    
    // Vertical lines
    for (let x = startX; x < endX; x += stepX) {
      const screenX = x + this.viewport.x;
      if (screenX >= -gridSize && screenX <= this.viewport.width + gridSize) {
        this.ctx.moveTo(screenX, 0);
        this.ctx.lineTo(screenX, this.viewport.height);
      }
    }
    
    // Horizontal lines
    for (let y = startY; y < endY; y += stepY) {
      const screenY = y + this.viewport.y;
      if (screenY >= -gridSize && screenY <= this.viewport.height + gridSize) {
        this.ctx.moveTo(0, screenY);
        this.ctx.lineTo(this.viewport.width, screenY);
      }
    }
    
    this.ctx.stroke();
    
    // Draw major grid lines (every 5th line) at higher zoom levels
    if (gridSize > 20) {
      this.renderMajorGrid(gridSize * 5, opacity * 0.5);
    }
  }

  renderMajorGrid(majorGridSize, opacity) {
    this.ctx.strokeStyle = `rgba(85, 85, 85, ${opacity})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    const startX = Math.floor(-this.viewport.x / majorGridSize) * majorGridSize;
    const startY = Math.floor(-this.viewport.y / majorGridSize) * majorGridSize;
    const endX = startX + this.viewport.width + majorGridSize;
    const endY = startY + this.viewport.height + majorGridSize;
    
    // Major vertical lines
    for (let x = startX; x < endX; x += majorGridSize) {
      const screenX = x + this.viewport.x;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.viewport.height);
    }
    
    // Major horizontal lines
    for (let y = startY; y < endY; y += majorGridSize) {
      const screenY = y + this.viewport.y;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.viewport.width, screenY);
    }
    
    this.ctx.stroke();
  }

  // Public methods
  resize() {
    if (!this.container || !this.canvas) {
      return;
    }
    
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Container not visible yet, try again later
      setTimeout(() => this.resize(), 100);
      return;
    }
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.viewport.width = rect.width;
    this.viewport.height = rect.height;
    
    this.render();
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.ctx;
  }

  // Utility methods
  isPointVisible(x, y) {
    const screen = this.worldToScreen(x, y);
    return screen.x >= 0 && screen.x <= this.viewport.width &&
           screen.y >= 0 && screen.y <= this.viewport.height;
  }

  isRectVisible(x, y, width, height) {
    const topLeft = this.worldToScreen(x, y);
    const bottomRight = this.worldToScreen(x + width, y + height);
    
    return !(bottomRight.x < 0 || topLeft.x > this.viewport.width ||
             bottomRight.y < 0 || topLeft.y > this.viewport.height);
  }
}

export { CanvasManager };