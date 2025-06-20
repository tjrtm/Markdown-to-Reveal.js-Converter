# Markdown to Reveal.js Converter

A powerful web-based tool that converts Markdown content into beautiful Reveal.js presentations. This tool provides a user-friendly interface for creating and customizing slide presentations using simple Markdown syntax.

## Features

- 📝 **Live Markdown Editor** with real-time preview option
- 📤 **File Upload Support** for existing Markdown files
- 🎨 **Customization Options**:
  - Background color selection
  - Custom background image support
  - Slide transition effects
  - Global text alignment
  - Font size control
- 🖥️ **Full-Screen Presentation Mode**
- 🔄 **Live Preview Toggle**
- 🎯 **Multiple Slide Separators**:
  - Horizontal slides: `---`
  - Vertical slides: Double newline
  - Speaker notes: Lines starting with `Note:`

## Getting Started

### Prerequisites

The tool runs directly in your web browser and uses CDN-hosted dependencies:
- Reveal.js 4.5.0
- Modern web browser with JavaScript enabled
- localhost server, use python or Visual Studio Code live preview add-on [[link ](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server)

### Usage

1. **Access the Tool**
   - Open `index.html` in your web browser

2. **Creating Slides**
   - Choose between using the built-in editor or uploading a Markdown file
   - Write or paste your Markdown content
   - Use `---` to separate slides

3. **Customizing Your Presentation**
   - Set background color using the color picker
   - Add background images via URL
   - Choose transition effects (None, Fade, Slide, Convex, Concave, Zoom)
   - Adjust text alignment (Left, Center, Right)
   - Modify global font size

4. **Previewing and Presenting**
   - Toggle "Live Preview" for real-time updates
   - Click "Render Slides" to update the preview manually
   - Use "Full Screen" for presentation mode (press Esc to exit)

## Markdown Syntax

### Basic Formatting

```markdown
# Slide Title
## Subtitle

Regular paragraph text

- Bullet point
- Another point

1. Numbered list
2. Second item

**Bold text**
*Italic text*
```

### Slide Separation

```markdown
# First Slide

Content for first slide

---

# Second Slide

Content for second slide
```

### Speaker Notes

```markdown
# Slide With Notes

Regular slide content

Note: These are speaker notes that only you can see
```

## Customization Options

### Background Options
- **Color**: Use the color picker to set a solid background color
- **Image**: Enter a URL to set a background image
  - Example URL format: `https://picsum.photos/200/300/?blur`

### Transitions
Available transition effects:
- None
- Fade
- Slide (default)
- Convex
- Concave
- Zoom

### Text Formatting
- Global text alignment (Left, Center, Right)
- Adjustable font size (10px - 72px)

## Browser Compatibility

The tool is compatible with modern web browsers that support:
- ES6+ JavaScript
- CSS Grid
- Flexbox
- Fullscreen API

## Dependencies

- [Reveal.js](https://revealjs.com/) v4.5.0
  - Core library
  - Markdown plugin

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project uses Reveal.js which is licensed under the MIT license. 
