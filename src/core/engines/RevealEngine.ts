/**
 * Reveal.js Engine Integration
 */

import type { Slide, SlideOptions, Project } from '@/types';
import { convertMarkdownToSlides } from '@/utils/markdown';

// Declare Reveal.js global
declare global {
  interface Window {
    Reveal: any;
  }
}

export class RevealEngine {
  private container: HTMLElement | null = null;
  private revealInstance: any = null;
  private initialized = false;

  /**
   * Initialize the engine
   */
  async init(container: HTMLElement): Promise<void> {
    this.container = container;

    // Wait for Reveal.js to be loaded
    await this.waitForReveal();

    console.log('✅ RevealEngine initialized');
    this.initialized = true;
  }

  /**
   * Wait for Reveal.js to be available
   */
  private async waitForReveal(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;

      const check = () => {
        if (window.Reveal) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 100);
        } else {
          reject(new Error('Reveal.js not loaded'));
        }
      };

      check();
    });
  }

  /**
   * Render markdown as slides
   */
  async renderMarkdown(markdown: string, options: SlideOptions = {}): Promise<void> {
    if (!this.initialized || !this.container) {
      throw new Error('Engine not initialized');
    }

    // Convert markdown to slides
    const slides = convertMarkdownToSlides(markdown, options);

    // Render slides
    await this.renderSlides(slides, options);
  }

  /**
   * Render slides
   */
  async renderSlides(slides: Slide[], options: SlideOptions = {}): Promise<void> {
    if (!this.container) {
      throw new Error('Container not set');
    }

    // Build HTML
    const slidesHtml = slides
      .map((slide) => {
        const attrs = this.buildSlideAttributes(slide.options || options);
        const notesHtml = slide.notes
          ? `<aside class="notes">${this.escapeHtml(slide.notes)}</aside>`
          : '';

        return `<section ${attrs}>${slide.content}${notesHtml}</section>`;
      })
      .join('\n');

    // Create Reveal container if needed
    let revealContainer = this.container.querySelector('.reveal');
    if (!revealContainer) {
      revealContainer = document.createElement('div');
      revealContainer.className = 'reveal';
      this.container.appendChild(revealContainer);
    }

    let slidesContainer = revealContainer.querySelector('.slides');
    if (!slidesContainer) {
      slidesContainer = document.createElement('div');
      slidesContainer.className = 'slides';
      revealContainer.appendChild(slidesContainer);
    }

    slidesContainer.innerHTML = slidesHtml;

    // Initialize or update Reveal
    await this.initReveal(options);
  }

  /**
   * Initialize Reveal.js
   */
  private async initReveal(options: SlideOptions = {}): Promise<void> {
    if (!this.container) return;

    const revealContainer = this.container.querySelector('.reveal');
    if (!revealContainer) return;

    // Destroy existing instance
    if (this.revealInstance) {
      try {
        this.revealInstance.destroy();
      } catch (error) {
        console.warn('Failed to destroy Reveal instance:', error);
      }
    }

    // Initialize new instance
    this.revealInstance = window.Reveal(revealContainer, {
      embedded: true,
      controls: true,
      progress: true,
      center: true,
      hash: false,
      transition: options.transition || 'slide',
      backgroundTransition: 'fade',
      slideNumber: 'c/t',
      width: '100%',
      height: '100%',
      margin: 0.1,
      minScale: 0.2,
      maxScale: 2.0,
      keyboard: true,
      overview: true,
      touch: true,
      loop: false,
      rtl: false,
      shuffle: false,
      fragments: true,
      fragmentInURL: false,
      help: true,
      pause: true,
      showNotes: false,
      autoPlayMedia: null,
      preloadIframes: null,
      autoAnimate: true,
      autoAnimateMatcher: null,
      autoAnimateEasing: 'ease',
      autoAnimateDuration: 1.0,
      autoAnimateUnmatched: true,
      autoAnimateStyles: [
        'opacity',
        'color',
        'background-color',
        'padding',
        'font-size',
        'line-height',
        'letter-spacing',
        'border-width',
        'border-color',
        'border-radius',
        'outline',
        'outline-offset',
      ],
      autoSlide: 0,
      autoSlideStoppable: true,
      autoSlideMethod: null,
      defaultTiming: null,
      mouseWheel: false,
      previewLinks: false,
      postMessage: true,
      postMessageEvents: false,
      focusBodyOnPageVisibilityChange: true,
      navigationMode: 'default',
      parallaxBackgroundImage: options.backgroundImage || '',
      parallaxBackgroundSize: '',
      parallaxBackgroundHorizontal: null,
      parallaxBackgroundVertical: null,
      display: 'block',
      hideInactiveCursor: true,
      hideCursorTime: 5000,
    });

    await this.revealInstance.initialize();

    // Apply global styles
    this.applyGlobalStyles(options);
  }

  /**
   * Build slide attributes
   */
  private buildSlideAttributes(options: SlideOptions): string {
    const attrs: string[] = [];

    if (options.backgroundColor) {
      attrs.push(`data-background-color="${this.escapeHtml(options.backgroundColor)}"`);
    }

    if (options.backgroundImage) {
      attrs.push(`data-background-image="${this.escapeHtml(options.backgroundImage)}"`);
    }

    if (options.transition) {
      attrs.push(`data-transition="${this.escapeHtml(options.transition)}"`);
    }

    return attrs.join(' ');
  }

  /**
   * Apply global styles
   */
  private applyGlobalStyles(options: SlideOptions): void {
    if (!this.container) return;

    const revealContainer = this.container.querySelector('.reveal') as HTMLElement;
    if (!revealContainer) return;

    if (options.fontSize) {
      revealContainer.style.fontSize = `${options.fontSize}px`;
    }

    if (options.textAlign) {
      const slides = revealContainer.querySelector('.slides') as HTMLElement;
      if (slides) {
        slides.style.textAlign = options.textAlign;
      }
    }
  }

  /**
   * Start presentation mode
   */
  async startPresentation(): Promise<void> {
    if (!this.revealInstance) {
      throw new Error('Reveal not initialized');
    }

    // Request fullscreen
    if (this.container && this.container.requestFullscreen) {
      try {
        await this.container.requestFullscreen();
      } catch (error) {
        console.warn('Fullscreen not supported or denied:', error);
      }
    }

    // Sync slides
    this.revealInstance.sync();
    this.revealInstance.slide(0);
  }

  /**
   * Exit presentation mode
   */
  async exitPresentation(): Promise<void> {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
      }
    }
  }

  /**
   * Navigate to slide
   */
  navigateToSlide(index: number): void {
    if (this.revealInstance) {
      this.revealInstance.slide(index);
    }
  }

  /**
   * Get current slide index
   */
  getCurrentSlideIndex(): number {
    if (!this.revealInstance) return 0;

    const indices = this.revealInstance.getIndices();
    return indices.h;
  }

  /**
   * Get total slides
   */
  getTotalSlides(): number {
    if (!this.revealInstance) return 0;

    return this.revealInstance.getTotalSlides();
  }

  /**
   * Export to HTML
   */
  exportToHTML(project: Project): string {
    const slides = project.slides || [];
    const options = project.globalOptions || {};

    const slidesHtml = slides
      .map((slide) => {
        const attrs = this.buildSlideAttributes(slide.options || options);
        const notesHtml = slide.notes
          ? `<aside class="notes">${this.escapeHtml(slide.notes)}</aside>`
          : '';

        return `<section ${attrs}>${slide.content}${notesHtml}</section>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(project.name || 'Presentation')}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/${options.theme || 'black'}.min.css">
  <style>
    .reveal { font-size: ${options.fontSize || 16}px; }
    .reveal .slides { text-align: ${options.textAlign || 'center'}; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slidesHtml}
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.js"></script>
  <script>
    Reveal.initialize({
      controls: true,
      progress: true,
      center: true,
      hash: true,
      transition: '${options.transition || 'slide'}',
      slideNumber: 'c/t',
    });
  </script>
</body>
</html>`;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy engine
   */
  destroy(): void {
    if (this.revealInstance) {
      try {
        this.revealInstance.destroy();
      } catch (error) {
        console.warn('Failed to destroy Reveal instance:', error);
      }
      this.revealInstance = null;
    }

    this.container = null;
    this.initialized = false;
  }
}
