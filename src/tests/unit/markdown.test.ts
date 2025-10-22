/**
 * Unit tests for markdown utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  convertMarkdownToSlides,
  countWords,
  estimateReadingTime,
  extractHeadings,
} from '@/utils/markdown';

describe('parseMarkdown', () => {
  it('should parse basic markdown', () => {
    const html = parseMarkdown('# Hello World');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello World');
  });

  it('should parse lists', () => {
    const markdown = '- Item 1\n- Item 2';
    const html = parseMarkdown(markdown);
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
  });

  it('should sanitize HTML', () => {
    const markdown = '<script>alert("xss")</script>';
    const html = parseMarkdown(markdown);
    expect(html).not.toContain('<script');
  });
});

describe('convertMarkdownToSlides', () => {
  it('should split slides by ---', () => {
    const markdown = '# Slide 1\n\n---\n\n# Slide 2';
    const slides = convertMarkdownToSlides(markdown);

    expect(slides).toHaveLength(2);
    expect(slides[0].order).toBe(0);
    expect(slides[1].order).toBe(1);
  });

  it('should extract speaker notes', () => {
    const markdown = '# Slide 1\n\nNote: This is a note';
    const slides = convertMarkdownToSlides(markdown);

    expect(slides).toHaveLength(1);
    expect(slides[0].notes).toBe('This is a note');
  });

  it('should apply options to slides', () => {
    const markdown = '# Slide 1';
    const options = { backgroundColor: '#000' };
    const slides = convertMarkdownToSlides(markdown, options);

    expect(slides[0].options).toEqual(options);
  });
});

describe('countWords', () => {
  it('should count words correctly', () => {
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('One two three four')).toBe(4);
  });

  it('should ignore markdown syntax', () => {
    expect(countWords('**bold** text')).toBe(2);
    expect(countWords('# Heading')).toBe(1);
  });

  it('should handle empty strings', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('estimateReadingTime', () => {
  it('should estimate reading time', () => {
    const text = 'word '.repeat(200); // 200 words
    expect(estimateReadingTime(text)).toBe(1); // 1 minute at 200 wpm
  });

  it('should round up', () => {
    const text = 'word '.repeat(250); // 250 words
    expect(estimateReadingTime(text)).toBe(2); // 2 minutes
  });

  it('should support custom WPM', () => {
    const text = 'word '.repeat(100);
    expect(estimateReadingTime(text, 100)).toBe(1);
  });
});

describe('extractHeadings', () => {
  it('should extract headings', () => {
    const markdown = '# H1\n## H2\n### H3';
    const headings = extractHeadings(markdown);

    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ level: 1, text: 'H1' });
    expect(headings[1]).toEqual({ level: 2, text: 'H2' });
    expect(headings[2]).toEqual({ level: 3, text: 'H3' });
  });

  it('should handle mixed content', () => {
    const markdown = 'Some text\n# Heading\nMore text';
    const headings = extractHeadings(markdown);

    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe('Heading');
  });
});
