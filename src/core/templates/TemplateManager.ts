/**
 * Template Manager
 */

import type { Template } from '@/types';

export class TemplateManager {
  private static templates: Map<string, Template> = new Map();

  /**
   * Load all templates
   */
  static async loadTemplates(): Promise<void> {
    const templateFiles = [
      '/templates/business-pitch.json',
      '/templates/educational-lesson.json',
      '/templates/portfolio-showcase.json',
    ];

    for (const file of templateFiles) {
      try {
        const response = await fetch(file);
        const data = await response.json();

        const template: Template = {
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags,
          slides: this.markdownToSlides(data.markdown),
        };

        this.templates.set(template.id, template);
      } catch (error) {
        console.warn(`Failed to load template ${file}:`, error);
      }
    }

    console.log(`✅ Loaded ${this.templates.size} templates`);
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter((t) => t.category === category);
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllTemplates().filter(
      (template) =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get template categories
   */
  static getCategories(): string[] {
    const categories = new Set<string>();
    this.getAllTemplates().forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }

  /**
   * Convert markdown to slides (simple version)
   */
  private static markdownToSlides(markdown: string): any[] {
    // Import the actual conversion function
    // For now, just split by ---
    const sections = markdown.split(/\n---\n/).filter((s) => s.trim());

    return sections.map((content, index) => ({
      id: `slide-${index}`,
      content,
      order: index,
    }));
  }
}
