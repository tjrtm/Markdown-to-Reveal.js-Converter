export function convertMarkdownToSlides(mdText, options = {}) {
  const {
    bgColor = "#000000",
    bgImage = "",
    transition = "slide",
    textAlign = "center"
  } = options;

  const slideSections = mdText.split(/\n---\n/);
  const slidesHTML = slideSections.map(section => {
    let dataAttributes = `data-background-color="${bgColor}" data-transition="${transition}" data-text-align="${textAlign}"`;
    if (bgImage.trim()) {
      dataAttributes += ` data-background-image="${bgImage.trim()}"`;
    }
    return `<section ${dataAttributes} data-markdown data-separator="\\n---\\n" data-separator-vertical="\\n\\n" data-separator-notes="^Note:" data-charset="utf-8">\n  <textarea data-template>${section.trim()}</textarea>\n</section>`;
  });
  return slidesHTML.join('\n');
}
