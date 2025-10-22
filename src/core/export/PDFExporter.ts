/**
 * PDF Exporter
 */

import type { Project, ExportOptions } from '@/types';

export class PDFExporter {
  /**
   * Export project to PDF
   */
  static async export(project: Project, options: ExportOptions = {}): Promise<Blob> {
    // For PDF export, we'll use the browser's print functionality
    // which provides the best quality and native PDF support

    // Create a temporary iframe for rendering
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '960px';
    iframe.style.height = '700px';
    iframe.style.left = '-10000px';
    document.body.appendChild(iframe);

    try {
      // Generate print-friendly HTML
      const html = this.generatePrintHTML(project, options);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load
      await this.waitForLoad(iframe);

      // For now, we'll guide users to use browser print
      // In a real implementation, you'd use a library like jsPDF or pdfmake
      return new Blob(
        [
          JSON.stringify({
            message: 'Use browser Print function (Ctrl+P) and select "Save as PDF"',
            project: project.name,
            instruction: 'This will create a high-quality PDF of your presentation',
          }),
        ],
        { type: 'application/json' }
      );
    } finally {
      document.body.removeChild(iframe);
    }
  }

  /**
   * Generate print-friendly HTML
   */
  private static generatePrintHTML(project: Project, options: ExportOptions): string {
    const slides = project.slides || [];
    const globalOptions = project.globalOptions || {};

    const slidesHtml = slides
      .map((slide, index) => {
        const pageBreak = index < slides.length - 1 ? 'page-break-after: always;' : '';
        return `
          <div class="slide" style="${pageBreak}">
            ${slide.content}
            ${
              slide.notes && options.includeNotes !== false
                ? `<div class="notes">Notes: ${this.escapeHtml(slide.notes)}</div>`
                : ''
            }
          </div>
        `;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(project.name || 'Presentation')}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1cm;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }

    .slide {
      width: 100%;
      min-height: 100vh;
      padding: 2cm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: ${globalOptions.textAlign || 'center'};
    }

    .notes {
      margin-top: 2em;
      padding: 1em;
      background: #f0f0f0;
      border-left: 4px solid #333;
      font-size: 0.9em;
      text-align: left;
    }

    h1 { font-size: 2.5em; margin: 0.5em 0; }
    h2 { font-size: 2em; margin: 0.5em 0; }
    h3 { font-size: 1.5em; margin: 0.5em 0; }

    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }

    code {
      font-family: 'Courier New', monospace;
    }

    img {
      max-width: 80%;
      max-height: 60vh;
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;
  }

  /**
   * Wait for iframe to load
   */
  private static waitForLoad(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      if (iframe.contentDocument?.readyState === 'complete') {
        resolve();
      } else {
        iframe.addEventListener('load', () => resolve());
      }
    });
  }

  /**
   * Escape HTML
   */
  private static escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
