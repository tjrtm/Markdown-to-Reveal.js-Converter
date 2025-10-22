/**
 * Export Manager - Handles all export operations
 */

import type { Project, ExportFormat, ExportOptions } from '@/types';
import { HTMLExporter } from './HTMLExporter';
import { PDFExporter } from './PDFExporter';
import { JSONExporter } from './JSONExporter';
import { downloadFile, sanitizeFilename } from '@/utils/helpers';

export class ExportManager {
  /**
   * Export project in specified format
   */
  static async export(
    project: Project,
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<void> {
    const filename = this.generateFilename(project, format);

    try {
      let blob: Blob;

      switch (format) {
        case 'html':
          blob = HTMLExporter.export(project, options);
          break;

        case 'pdf':
          blob = await PDFExporter.export(project, options);
          if (blob.type === 'application/json') {
            // PDF export returns instructions
            const text = await blob.text();
            const data = JSON.parse(text);
            alert(data.message + '\n\n' + data.instruction);
            return;
          }
          break;

        case 'json':
          blob = JSONExporter.export(project, options);
          break;

        case 'markdown':
          blob = this.exportMarkdown(project);
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      downloadFile(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Export to markdown
   */
  private static exportMarkdown(project: Project): Blob {
    const slides = project.slides || [];
    const markdown = slides
      .sort((a, b) => a.order - b.order)
      .map((slide) => {
        let content = slide.content;

        // Remove HTML tags for markdown export
        const temp = document.createElement('div');
        temp.innerHTML = content;
        content = temp.textContent || temp.innerText || '';

        if (slide.notes) {
          content += '\n\nNote: ' + slide.notes;
        }

        return content;
      })
      .join('\n\n---\n\n');

    return new Blob([markdown], { type: 'text/markdown' });
  }

  /**
   * Generate filename
   */
  private static generateFilename(project: Project, format: ExportFormat): string {
    const name = sanitizeFilename(project.name || 'presentation');
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getExtension(format);

    return `${name}-${timestamp}.${extension}`;
  }

  /**
   * Get file extension
   */
  private static getExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      html: 'html',
      pdf: 'pdf',
      json: 'json',
      markdown: 'md',
      pptx: 'pptx',
    };

    return extensions[format] || format;
  }

  /**
   * Import project from JSON
   */
  static async importJSON(file: File): Promise<Project> {
    const text = await file.text();
    return JSONExporter.import(text);
  }
}
