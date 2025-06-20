// main.js

import RevealMarkdown from "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/plugin/markdown/markdown.esm.js";
import { convertMarkdownToSlides } from './slides.js';

const markdownInput = document.getElementById('markdown-input');
const slidesContainer = document.getElementById('slides-container');
const renderButton = document.getElementById('render-button');
const autoPreviewCheckbox = document.getElementById('auto-preview');
const fileUploadInput = document.getElementById('md-file-upload');

// Slide options elements
const bgColorInput = document.getElementById('bg-color');
const bgImageInput = document.getElementById('bg-image');
const transitionSelect = document.getElementById('transition');
const textAlignSelect = document.getElementById('global-text-align');
const fontSizeInput = document.getElementById('font-size');

// Source selection elements
const sourceRadios = document.getElementsByName('source-type');
const fullScreenButton = document.getElementById('full-screen-button');

let revealInstance = null;

// Applies global text alignment and font size to all slide sections.
function applyGlobalStyles() {
  document.querySelectorAll('#slides-container section').forEach(slide => {
    slide.style.textAlign = textAlignSelect.value;
    slide.style.fontSize = fontSizeInput.value + "px";
  });
}

// Renders the preview slides using the current markdown content and the slide options.
function renderPreview() {
  const mdText = markdownInput.value;
  const slidesHTML = convertMarkdownToSlides(mdText, {
    bgColor: bgColorInput.value || "#000000",
    bgImage: bgImageInput.value.trim(),
    transition: transitionSelect.value || "slide",
    textAlign: textAlignSelect.value || "center"
  });
  slidesContainer.innerHTML = slidesHTML;
  initializeReveal();
}

// Initializes or re-initializes the Reveal.js instance.
function initializeReveal() {
  if (revealInstance) {
    revealInstance.destroy();
    revealInstance = null;
  }
  revealInstance = new Reveal(document.querySelector('#preview-reveal'), {
    hash: true,
    plugins: [ RevealMarkdown ]
  });
  revealInstance.initialize();

  // Listen for the 'ready' event to apply global styles.
  revealInstance.addEventListener('ready', function() {
    applyGlobalStyles();
  });

  // Also update global styles on slide change (in case slides are re-rendered by Reveal).
  revealInstance.on('slidechanged', function() {
    applyGlobalStyles();
  });
}

// Handle file upload for markdown content.
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      markdownInput.value = ev.target.result;
      renderPreview();
    };
    reader.readAsText(file);
  }
}

// Toggle between editor and file upload based on source selection.
function updateSourceSelection() {
  const selectedValue = [...sourceRadios].find(radio => radio.checked).value;
  if (selectedValue === 'upload') {
    markdownInput.style.display = 'none';
    fileUploadInput.style.display = 'block';
  } else {
    markdownInput.style.display = 'block';
    fileUploadInput.style.display = 'none';
  }
}

// Add fullscreen functionality
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
      .then(() => {
        document.body.classList.add('full-screen');
      })
      .catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
  } else {
    exitFullScreen();
  }
}

function exitFullScreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
      .then(() => {
        document.body.classList.remove('full-screen');
      })
      .catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message}`);
      });
  }
}

// Event Listeners

// Change source type
sourceRadios.forEach(radio => {
  radio.addEventListener('change', updateSourceSelection);
});

// File upload listener.
fileUploadInput.addEventListener('change', handleFileUpload);

// Render button click.
renderButton.addEventListener('click', renderPreview);

// Auto preview (live update) listener.
markdownInput.addEventListener('input', () => {
  if (autoPreviewCheckbox.checked) {
    renderPreview();
  }
});

// Slide options change listeners.
[bgColorInput, bgImageInput, textAlignSelect, fontSizeInput].forEach(input => {
  input.addEventListener('input', () => {
    if (autoPreviewCheckbox.checked) {
      renderPreview();
    } else {
      // If not auto updating, apply global styles immediately.
      applyGlobalStyles();
    }
  });
});
transitionSelect.addEventListener('change', () => {
  if (autoPreviewCheckbox.checked) {
    renderPreview();
  }
});

fullScreenButton.addEventListener('click', toggleFullScreen);

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove('full-screen');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.fullscreenElement) {
    exitFullScreen();
  }
});

// Ensure live update is off by default.
autoPreviewCheckbox.checked = false;

// Initial render on page load with sample markdown content.
const initialMarkdown = `
# Reveal.js Converter Demo

This presentation demonstrates **all** supported Markdown features.

---

## Lists and Formatting

- **Bold** text
- *Italic* style
- Inline \`code\`
- ~~Strikethrough~~
- [Reveal.js website](https://revealjs.com)

1. First item
2. Second item

---

## Quotes, Code and Images

> Block quotes work great.

\`\`\`javascript
console.log('Hello world');
\`\`\`

![Sample Image](https://picsum.photos/200)

---

## Vertical Slides

Top slide content.

## First sub-slide

More details here.

## Second sub-slide

Even more info.

---

## Speaker Notes

Content visible to the audience.

Note: These notes are only shown to the presenter.
`;
markdownInput.value = initialMarkdown;
updateSourceSelection();
renderPreview();