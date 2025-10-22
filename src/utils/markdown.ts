/**
 * Markdown processing utilities
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Slide, SlideOptions } from '@/types';
import { generateId } from './helpers';

/**
 * Configure marked
 */
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(markdown: string): string {
  const html = marked.parse(markdown) as string;
  return DOMPurify.sanitize(html);
}

/**
 * Convert markdown to slides
 */
export function convertMarkdownToSlides(
  markdown: string,
  options: SlideOptions = {}
): Slide[] {
  const slides: Slide[] = [];

  // Split by horizontal separator (---)
  const sections = markdown.split(/^---$/m).filter((s) => s.trim());

  sections.forEach((section, index) => {
    const lines = section.trim().split('\n');
    const content: string[] = [];
    let notes = '';

    // Extract speaker notes
    let inNotes = false;
    for (const line of lines) {
      if (line.trim().startsWith('Note:')) {
        inNotes = true;
        notes += line.replace(/^Note:\s*/, '') + '\n';
      } else if (inNotes) {
        notes += line + '\n';
      } else {
        content.push(line);
      }
    }

    const contentHtml = parseMarkdown(content.join('\n'));

    slides.push({
      id: generateId('slide'),
      content: contentHtml,
      notes: notes.trim() || undefined,
      options: { ...options },
      order: index,
    });
  });

  return slides;
}

/**
 * Convert slides back to markdown
 */
export function convertSlidesToMarkdown(slides: Slide[]): string {
  return slides
    .sort((a, b) => a.order - b.order)
    .map((slide) => {
      let markdown = slide.content;

      if (slide.notes) {
        markdown += '\n\nNote: ' + slide.notes;
      }

      return markdown;
    })
    .join('\n\n---\n\n');
}

/**
 * Extract headings from markdown
 */
export function extractHeadings(markdown: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }

  return headings;
}

/**
 * Generate table of contents
 */
export function generateTableOfContents(markdown: string): string {
  const headings = extractHeadings(markdown);

  if (headings.length === 0) {
    return '';
  }

  let toc = '## Table of Contents\n\n';

  headings.forEach((heading) => {
    const indent = '  '.repeat(heading.level - 1);
    const link = heading.text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    toc += `${indent}- [${heading.text}](#${link})\n`;
  });

  return toc;
}

/**
 * Count words in markdown
 */
export function countWords(markdown: string): number {
  // Remove markdown syntax
  const text = markdown
    .replace(/^#{1,6}\s+/gm, '') // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/!\[.*?\]\(.+?\)/g, '') // Remove images
    .trim();

  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Estimate reading time
 */
export function estimateReadingTime(markdown: string, wordsPerMinute = 200): number {
  const words = countWords(markdown);
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Add syntax highlighting class
 */
export function addSyntaxHighlighting(html: string): string {
  return html.replace(
    /<pre><code class="language-(\w+)">/g,
    '<pre><code class="language-$1 hljs">'
  );
}

/**
 * Process special markdown features
 */
export function processSpecialFeatures(markdown: string): string {
  let processed = markdown;

  // Process math expressions ($$...$$)
  processed = processed.replace(/\$\$(.+?)\$\$/g, (_, math) => {
    return `<span class="math-block" data-math="${math}"></span>`;
  });

  // Process inline math ($...$)
  processed = processed.replace(/\$(.+?)\$/g, (_, math) => {
    return `<span class="math-inline" data-math="${math}"></span>`;
  });

  // Process mermaid diagrams
  processed = processed.replace(/```mermaid\n([\s\S]*?)```/g, (_, diagram) => {
    return `<div class="mermaid">${diagram}</div>`;
  });

  return processed;
}

/**
 * Create slide metadata
 */
export function extractSlideMetadata(markdown: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^<!--\s*@(\w+):\s*(.+?)\s*-->$/);
    if (match) {
      metadata[match[1]] = match[2];
    }
  }

  return metadata;
}
