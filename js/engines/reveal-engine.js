/**
 * Reveal.js Engine
 * Converts node-based presentations to Reveal.js format
 */

import { BaseEngine } from './base-engine.js';

class RevealEngine extends BaseEngine {
  constructor(options = {}) {
    super(options);
    
    this.revealInstance = null;
  }

  static getCapabilities() {
    return {
      name: 'Reveal.js',
      description: 'Professional presentation framework with advanced features',
      version: '4.5.0',
      features: {
        themes: ['black', 'white', 'league', 'beige', 'sky', 'night', 'serif', 'simple', 'solarized'],
        transitions: ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'],
        exportFormats: ['html', 'pdf'],
        nodeTypes: ['text', 'image', 'code'],
        navigation: true,
        overview: true,
        notes: true,
        fragments: true,
        backgrounds: true,
        customCSS: true,
        plugins: ['markdown', 'highlight', 'search', 'notes', 'zoom']
      },
      requirements: {
        browser: 'modern',
        dependencies: [
          {
            type: 'script',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.js',
            name: 'Reveal.js Core'
          },
          {
            type: 'css',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css',
            name: 'Reveal.js CSS'
          },
          {
            type: 'css',
            url: 'https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/black.min.css',
            name: 'Reveal.js Theme'
          }
        ],
        cdn: ['https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/']
      }
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

  getDefaultConfig() {
    return {
      ...super.getDefaultConfig(),
      hash: true,
      controls: true,
      progress: true,
      history: true,
      center: true,
      transition: 'slide',
      backgroundTransition: 'fade',
      theme: 'black',
      plugins: []
    };
  }

  setupContainer() {
    this.container.innerHTML = `
      <div class="reveal" id="reveal-presentation">
        <div class="slides" id="reveal-slides">
          <!-- Slides will be generated here -->
        </div>
      </div>
    `;
  }

  async generatePresentation(nodes, connections = []) {
    if (!this.isInitialized) {
      throw new Error('Reveal.js engine not ready');
    }

    // Validate nodes
    const validation = this.validateNodes(nodes);
    if (!validation.isValid) {
      console.warn('Node validation issues:', validation.issues);
    }

    // Analyze connection flow for presentation ordering
    const flowAnalysis = this.analyzeConnectionFlow(nodes, connections);
    console.log('Reveal.js flow analysis:', flowAnalysis);

    // Convert nodes to slides using connection-aware sorting
    const sortedNodes = this.sortNodesForPresentation(nodes, connections);
    this.slides = sortedNodes.map(node => this.convertNodeToSlide(node));
    
    // Generate slide HTML
    const slidesHTML = this.slides.map(slide => this.convertSlideToHTML(slide)).join('\n');
    
    // Update DOM
    const slidesContainer = document.getElementById('reveal-slides');
    slidesContainer.innerHTML = slidesHTML;

    // Initialize or reinitialize Reveal
    await this.initializeReveal();

    return {
      engine: 'reveal',
      slideCount: this.slides.length,
      html: slidesContainer.innerHTML,
      flowAnalysis
    };
  }

  convertSlideToHTML(slide) {
    const slideAttributes = this.generateSlideAttributes(slide);
    return `<section ${slideAttributes}>${slide.content}</section>`;
  }

  generateCodeContent(content) {
    if (!content?.code) {
      return '<p>Empty code block</p>';
    }

    const language = content.language || 'text';
    const code = this.escapeHtml(content.code);

    return `
      <div class="code-content">
        <pre><code data-trim data-language="${language}">${code}</code></pre>
      </div>
    `;
  }

  generateSlideAttributes(slide) {
    const attributes = [];
    
    // Background color
    if (slide.background && slide.background !== 'transparent') {
      attributes.push(`data-background-color="${slide.background}"`);
    }
    
    // Background image (from node style)
    if (slide.style?.backgroundImage) {
      attributes.push(`data-background-image="${slide.style.backgroundImage}"`);
    }
    
    // Transition
    if (slide.transition && slide.transition !== this.config.transition) {
      attributes.push(`data-transition="${slide.transition}"`);
    }
    
    // Text alignment
    if (slide.style?.textAlign) {
      attributes.push(`data-text-align="${slide.style.textAlign}"`);
    }

    // Add slide ID for reference
    attributes.push(`data-slide-id="${slide.id}"`);

    return attributes.join(' ');
  }

  async initializeReveal() {
    // Destroy existing instance
    if (this.revealInstance) {
      this.revealInstance.destroy();
      this.revealInstance = null;
    }

    // Wait for next tick to ensure DOM is updated
    await new Promise(resolve => setTimeout(resolve, 10));

    // Initialize new instance with current config
    this.revealInstance = new Reveal(document.querySelector('#reveal-presentation'), this.config);

    await this.revealInstance.initialize();

    // Apply global styles
    this.applyConfig();
  }

  applyConfig() {
    const slides = document.querySelectorAll('#reveal-slides section');
    slides.forEach(slide => {
      // Apply global styling based on config
      if (this.config.fontSize) {
        slide.style.fontSize = this.config.fontSize;
      }
    });
  }

  async startPresentation() {
    if (!this.revealInstance) {
      throw new Error('Presentation not generated');
    }

    // Show presentation container
    this.container.style.display = 'block';
    
    // Add escape key listener
    this.setupPresentationControls();
    
    // Sync to first slide
    this.revealInstance.sync();
  }

  async stopPresentation() {
    // Hide presentation container
    this.container.style.display = 'none';
    
    // Remove event listeners
    this.removePresentationControls();
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

  async exportPresentation(format = 'html') {
    if (!this.revealInstance) {
      throw new Error('Presentation not generated');
    }

    switch (format) {
      case 'html':
        return this.exportHTML();
      case 'pdf':
        return this.exportPDF();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportHTML() {
    const slidesHTML = document.getElementById('reveal-slides').innerHTML;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Presentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/black.min.css">
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slidesHTML}
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.js"></script>
    <script>
        Reveal.initialize({
            hash: true,
            controls: true,
            progress: true,
            history: true,
            center: true,
            transition: 'slide'
        });
    </script>
</body>
</html>
    `.trim();
  }

  exportPDF() {
    // This would typically require a server-side solution
    // For now, provide instructions
    return {
      message: 'PDF export requires print-to-PDF from browser',
      url: window.location.href + '?print-pdf'
    };
  }

  async destroy() {
    if (this.revealInstance) {
      this.revealInstance.destroy();
      this.revealInstance = null;
    }
    
    this.removePresentationControls();
    this.isReady = false;
  }
}

export { RevealEngine };