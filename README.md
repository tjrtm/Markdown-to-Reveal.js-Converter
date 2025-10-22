# PresentFlow Pro 🎭

> **A modern, production-ready presentation builder with Markdown support**

Transform your markdown into beautiful presentations with live preview, multiple themes, and powerful export options.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Tests](https://img.shields.io/badge/tests-65%20passing-success)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

### 🚀 **Quick Mode**
- **Live Markdown Editor** - Write presentations in markdown with real-time preview
- **Beautiful Themes** - Choose from 9 professional Reveal.js themes
- **Smooth Transitions** - 6 transition effects (slide, fade, convex, etc.)
- **Speaker Notes** - Full support for presenter notes
- **Auto-save** - Automatically saves your work to localStorage
- **File Operations** - Load and save markdown files

### 📤 **Export System**
- **HTML** - Standalone single-file presentations
- **PDF** - High-quality print-friendly documents
- **JSON** - Save and reload projects
- **Markdown** - Export back to plain markdown

### 🎨 **Modern Design**
- Glassmorphism UI with backdrop blur effects
- Smooth animations and transitions
- Dark/Light/Auto theme modes
- Responsive mobile-first design
- Futuristic neon gradients

### ♿ **Accessibility**
- Full keyboard navigation support
- ARIA labels throughout
- Screen reader compatible
- High contrast mode available
- Reduced motion support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 7.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/tjrtm/Markdown-to-Reveal.js-Converter.git

# Navigate to directory
cd Markdown-to-Reveal.js-Converter

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

---

## 📖 Usage

### Creating Your First Presentation

1. **Write Markdown** - Use the editor on the left
2. **Separate Slides** - Use `---` to create new slides
3. **Add Notes** - Lines starting with `Note:` become speaker notes
4. **Preview** - Click "Render Preview" to see your slides
5. **Present** - Hit "Present" for fullscreen mode
6. **Export** - Choose your export format

### Markdown Syntax

#### Basic Slide

\`\`\`markdown
# Welcome Slide

This is the first slide content

---

## Second Slide

- Bullet point 1
- Bullet point 2
\`\`\`

#### Speaker Notes

\`\`\`markdown
# Slide with Notes

Visible content here

Note: This will only be visible to the presenter
\`\`\`

#### Code Highlighting

\`\`\`markdown
# Code Example

\\\`\\\`\\\`javascript
function hello() {
  console.log("Hello, World!");
}
\\\`\\\`\\\`
\`\`\`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save project |
| `Ctrl/Cmd + N` | New project |
| `Ctrl/Cmd + O` | Open project |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `F11` | Toggle fullscreen |
| `ESC` | Exit presentation mode |

---

## 🏗️ Development

### Project Structure

\`\`\`
presentflow-pro/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.ts                  # Main App class
│   ├── core/
│   │   ├── state/              # State management
│   │   ├── engines/            # Presentation engines
│   │   ├── export/             # Export system
│   │   └── templates/          # Template management
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript definitions
│   ├── styles/                 # Global styles
│   └── tests/                  # Test suites
├── public/
│   ├── templates/              # Built-in templates
│   └── assets/                 # Static assets
├── dist/                       # Production build
└── package.json
\`\`\`

### Available Scripts

\`\`\`bash
# Development
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Lint code with ESLint
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test helpers.test.ts

# Watch mode
npm test -- --watch
\`\`\`

---

## 🎨 Customization

### Themes

Available themes:
- Black (default)
- White
- League
- Beige
- Sky
- Night
- Serif
- Simple
- Solarized

### Transitions

Available transitions:
- Slide (default)
- Fade
- Convex
- Concave
- Zoom
- None

---

## 📦 Tech Stack

### Core
- **Vite** 5.0 - Lightning-fast build tool
- **TypeScript** 5.3 - Type-safe JavaScript
- **Tailwind CSS** 3.4 - Utility-first CSS

### Libraries
- **Reveal.js** 4.5 - Presentation framework
- **Marked** - Markdown parser
- **DOMPurify** - XSS protection
- **Prism.js** - Syntax highlighting
- **KaTeX** - Math rendering

### Testing
- **Vitest** - Fast unit testing
- **Playwright** - E2E testing
- **JSDOM** - DOM testing environment

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** strict mode

---

## 🧪 Testing

### Test Coverage

\`\`\`
✓ 65 tests passing
✓ Unit tests for utilities
✓ Unit tests for state management
✓ Unit tests for validation
✓ Unit tests for markdown processing
\`\`\`

---

## 🚀 Deployment

### Build for Production

\`\`\`bash
npm run build
\`\`\`

This creates an optimized build in the `dist/` directory with:
- Minified and tree-shaken JavaScript
- Optimized CSS
- Source maps for debugging
- Code splitting for faster loads
- Asset optimization

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Reveal.js** - Amazing presentation framework
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend tooling
- **TypeScript** - Typed JavaScript at scale

---

<div align="center">

**Built with ❤️ using Claude Code**

⭐ Star us on GitHub!

</div>
