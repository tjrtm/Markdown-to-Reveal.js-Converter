import { convertMarkdownToSlides } from '../slides.js';

describe('convertMarkdownToSlides', () => {
  test('generates sections with expected attributes', () => {
    const md = '# Title\n\n---\n\n## Slide 2';
    const html = convertMarkdownToSlides(md, {
      bgColor: '#ffffff',
      transition: 'fade',
      textAlign: 'left'
    });

    expect(html).toContain('<section');
    const sections = html.match(/<section/g) || [];
    expect(sections.length).toBe(2);
    expect(html).toContain('data-background-color="#ffffff"');
    expect(html).toContain('data-transition="fade"');
    expect(html).toContain('data-text-align="left"');
  });
});
