/**
 * JSON Exporter
 */

import type { Project, ExportOptions } from '@/types';

export class JSONExporter {
  /**
   * Export project to JSON
   */
  static export(project: Project, options: ExportOptions = {}): Blob {
    const json = this.generateJSON(project, options);
    const formatted = options.minify ? json : JSON.stringify(JSON.parse(json), null, 2);
    return new Blob([formatted], { type: 'application/json' });
  }

  /**
   * Generate JSON
   */
  private static generateJSON(project: Project, options: ExportOptions): string {
    const exportData = {
      version: '2.0.0',
      generator: 'PresentFlow Pro',
      exported: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        mode: project.mode,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        version: project.version,
        engine: project.engine,
        metadata: project.metadata,
        globalOptions: project.globalOptions,
        slides: project.slides.map((slide) => ({
          id: slide.id,
          content: slide.content,
          notes: options.includeNotes !== false ? slide.notes : undefined,
          options: slide.options,
          order: slide.order,
          verticalSlides: slide.verticalSlides,
        })),
        nodes: project.nodes,
        connections: project.connections,
      },
    };

    return JSON.stringify(exportData);
  }

  /**
   * Import from JSON
   */
  static import(json: string): Project {
    const data = JSON.parse(json);

    // Validate version
    if (data.version && !this.isCompatibleVersion(data.version)) {
      console.warn(`Project version ${data.version} may not be fully compatible`);
    }

    return data.project as Project;
  }

  /**
   * Check version compatibility
   */
  private static isCompatibleVersion(version: string): boolean {
    const [major] = version.split('.').map(Number);
    return major === 2; // Compatible with v2.x.x
  }
}
