/**
 * Modal Editor Component
 * Full-screen modal for editing node content
 */

class ModalEditor {
  constructor(options = {}) {
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    
    this.currentNode = null;
    this.modal = null;
    
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'modal-editor';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    document.body.appendChild(this.modal);
  }

  open(node) {
    this.currentNode = node;
    this.render();
    this.modal.style.display = 'flex';
    
    // Focus on content area
    setTimeout(() => {
      const textarea = this.modal.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }

  close() {
    this.modal.style.display = 'none';
    this.currentNode = null;
  }

  render() {
    if (!this.currentNode) return;

    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit ${this.getNodeTypeTitle(this.currentNode.type)} Node</h2>
          <div class="modal-actions">
            <button class="modal-btn primary" id="modal-save">Save</button>
            <button class="modal-btn" id="modal-cancel">Cancel</button>
            <button class="modal-btn close" id="modal-close">✕</button>
          </div>
        </div>
        
        <div class="modal-body">
          <div class="editor-layout">
            <div class="editor-panel">
              <h3>Content</h3>
              ${this.renderEditor()}
            </div>
            <div class="preview-panel">
              <h3>Preview</h3>
              <div class="preview-content" id="preview-content">
                ${this.renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupModalEventListeners();
  }

  renderEditor() {
    switch (this.currentNode.type) {
      case 'text':
        return this.renderTextEditor();
      case 'image':
        return this.renderImageEditor();
      case 'code':
        return this.renderCodeEditor();
      default:
        return this.renderDefaultEditor();
    }
  }

  renderTextEditor() {
    const text = this.currentNode.content?.text || '';
    
    return `
      <div class="editor-group">
        <label>Text Content (Markdown supported):</label>
        <div class="text-editor-container">
          <div class="markdown-toolbar">
            <button type="button" class="md-btn" data-before="**" data-after="**" title="Bold">B</button>
            <button type="button" class="md-btn" data-before="*" data-after="*" title="Italic">I</button>
            <button type="button" class="md-btn" data-before="\`" data-after="\`" title="Code">&lt;/&gt;</button>
            <button type="button" class="md-btn" data-before="# " data-after="" title="Heading">H1</button>
            <button type="button" class="md-btn" data-before="## " data-after="" title="Heading 2">H2</button>
            <button type="button" class="md-btn" data-before="- " data-after="" title="List">List</button>
            <button type="button" class="md-btn" data-before="[" data-after="](url)" title="Link">Link</button>
            <button type="button" class="md-btn" data-before="> " data-after="" title="Quote">&quot;</button>
          </div>
          <textarea id="content-text" 
                    rows="20" 
                    class="text-textarea"
                    placeholder="Enter your text here...

Examples:
# Heading 1
## Heading 2
**Bold text**
*Italic text*
\`inline code\`
- List item
> Quote

[Link text](https://example.com)">${this.escapeHtml(text)}</textarea>
        </div>
        <small>💡 Use toolbar buttons or type markdown directly. Preview updates in real-time!</small>
      </div>
    `;
  }

  renderImageEditor() {
    const imageUrl = this.currentNode.content?.imageUrl || '';
    const alt = this.currentNode.content?.alt || '';
    const caption = this.currentNode.content?.caption || '';

    return `
      <div class="editor-group">
        <label>Image Source:</label>
        <div class="image-input-tabs">
          <button type="button" class="tab-btn active" onclick="this.switchImageTab('url')">URL</button>
          <button type="button" class="tab-btn" onclick="this.switchImageTab('upload')">Upload</button>
        </div>
        
        <div id="url-tab" class="image-tab active">
          <input type="url" id="content-image-url" value="${imageUrl}" placeholder="https://example.com/image.jpg">
          <small>Paste an image URL from the web</small>
        </div>
        
        <div id="upload-tab" class="image-tab">
          <div class="image-drop-zone" id="image-drop-zone">
            <div class="drop-zone-content">
              <div class="drop-icon">📁</div>
              <p>Drag & drop an image here</p>
              <p><strong>or</strong></p>
              <input type="file" id="content-image-file" accept="image/*" style="display: none;">
              <button type="button" class="upload-btn" onclick="document.getElementById('content-image-file').click()">Choose File</button>
            </div>
          </div>
          <small>Supports: JPG, PNG, GIF, WebP (max 5MB)</small>
        </div>
      </div>
      
      <div class="editor-group">
        <label>Alt Text (for accessibility):</label>
        <input type="text" id="content-alt" value="${alt}" placeholder="Describe what's in the image">
      </div>
      
      <div class="editor-group">
        <label>Caption (optional):</label>
        <input type="text" id="content-caption" value="${caption}" placeholder="Image caption or description">
      </div>
      
      <div class="editor-group">
        <label>Image Settings:</label>
        <div class="image-settings">
          <label class="checkbox-label">
            <input type="checkbox" id="content-fit-width" ${this.currentNode.content?.fitWidth ? 'checked' : ''}>
            Fit to slide width
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="content-center-image" ${this.currentNode.content?.centerImage ? 'checked' : ''}>
            Center image
          </label>
        </div>
      </div>
    `;
  }

  renderCodeEditor() {
    const code = this.currentNode.content?.code || '';
    const language = this.currentNode.content?.language || 'javascript';

    return `
      <div class="editor-group">
        <label>Programming Language:</label>
        <select id="content-language">
          <option value="javascript" ${language === 'javascript' ? 'selected' : ''}>JavaScript</option>
          <option value="python" ${language === 'python' ? 'selected' : ''}>Python</option>
          <option value="html" ${language === 'html' ? 'selected' : ''}>HTML</option>
          <option value="css" ${language === 'css' ? 'selected' : ''}>CSS</option>
          <option value="json" ${language === 'json' ? 'selected' : ''}>JSON</option>
          <option value="bash" ${language === 'bash' ? 'selected' : ''}>Bash</option>
          <option value="sql" ${language === 'sql' ? 'selected' : ''}>SQL</option>
          <option value="typescript" ${language === 'typescript' ? 'selected' : ''}>TypeScript</option>
          <option value="markdown" ${language === 'markdown' ? 'selected' : ''}>Markdown</option>
          <option value="yaml" ${language === 'yaml' ? 'selected' : ''}>YAML</option>
        </select>
      </div>
      
      <div class="editor-group">
        <label>Code:</label>
        <div class="code-editor-container">
          <div class="code-editor-toolbar">
            <button type="button" class="code-btn" onclick="this.parentElement.parentElement.querySelector('textarea').style.fontSize = '12px'">Small</button>
            <button type="button" class="code-btn" onclick="this.parentElement.parentElement.querySelector('textarea').style.fontSize = '14px'">Medium</button>
            <button type="button" class="code-btn" onclick="this.parentElement.parentElement.querySelector('textarea').style.fontSize = '16px'">Large</button>
            <button type="button" class="code-btn" onclick="this.formatCode()">Format</button>
          </div>
          <textarea id="content-code" 
                    rows="20" 
                    spellcheck="false"
                    class="code-textarea" 
                    placeholder="Enter your code here...">${this.escapeHtml(code)}</textarea>
        </div>
      </div>
    `;
  }

  renderDefaultEditor() {
    return `
      <div class="editor-group">
        <label>Content:</label>
        <textarea id="content-default" rows="20" placeholder="Enter content here..."></textarea>
      </div>
    `;
  }

  renderPreview() {
    switch (this.currentNode.type) {
      case 'text':
        return this.renderTextPreview();
      case 'image':
        return this.renderImagePreview();
      case 'code':
        return this.renderCodePreview();
      default:
        return '<p>Preview not available for this node type</p>';
    }
  }

  renderTextPreview() {
    const text = this.currentNode.content?.text || '';
    
    // Simple markdown conversion
    let html = text
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    return html || '<p><em>Enter text to see preview</em></p>';
  }

  renderImagePreview() {
    const imageUrl = this.currentNode.content?.imageUrl || '';
    const alt = this.currentNode.content?.alt || '';
    const caption = this.currentNode.content?.caption || '';

    if (!imageUrl) {
      return '<p><em>Enter image URL to see preview</em></p>';
    }

    let html = `<img src="${imageUrl}" alt="${alt}" style="max-width: 100%; max-height: 300px;">`;
    
    if (caption) {
      html += `<p><small>${caption}</small></p>`;
    }

    return html;
  }

  renderCodePreview() {
    const code = this.currentNode.content?.code || '';
    const language = this.currentNode.content?.language || 'javascript';

    if (!code) {
      return '<p><em>Enter code to see preview</em></p>';
    }

    return `<pre><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`;
  }

  setupEventListeners() {
    // Global escape key
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.close();
      }
    };
    
    document.addEventListener('keydown', this.handleKeyDown);

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  setupModalEventListeners() {
    // Save button
    document.getElementById('modal-save').addEventListener('click', () => {
      this.save();
    });

    // Cancel button
    document.getElementById('modal-cancel').addEventListener('click', () => {
      this.cancel();
    });

    // Close button
    document.getElementById('modal-close').addEventListener('click', () => {
      this.close();
    });

    // Setup enhanced features
    this.setupMarkdownToolbar();
    this.setupImageUpload();
    this.setupCodeEditor();
    this.setupKeyboardShortcuts();

    // Live preview updates
    this.setupLivePreview();
  }

  setupMarkdownToolbar() {
    // Method for markdown insertion
    const insertMarkdown = (before, after) => {
      const textarea = document.getElementById('content-text');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      const newText = before + selectedText + after;
      textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
      
      // Update cursor position
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
      
      // Trigger preview update
      this.updatePreview();
    };

    // Add event listeners to markdown toolbar buttons
    document.querySelectorAll('.md-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const before = btn.dataset.before || '';
        const after = btn.dataset.after || '';
        insertMarkdown(before, after);
      });
    });

    // Keep global method for backward compatibility
    window.insertMarkdown = insertMarkdown;
  }

  setupImageUpload() {
    const dropZone = document.getElementById('image-drop-zone');
    const fileInput = document.getElementById('content-image-file');
    
    if (!dropZone || !fileInput) return;

    // Global method for tab switching
    window.switchImageTab = (tab) => {
      document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      
      document.getElementById(`${tab}-tab`).classList.add('active');
      event.target.classList.add('active');
    };

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleImageFile(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageFile(e.target.files[0]);
      }
    });
  }

  setupCodeEditor() {
    // Global method for code formatting
    window.formatCode = () => {
      const textarea = document.getElementById('content-code');
      const language = document.getElementById('content-language')?.value;
      
      if (!textarea) return;
      
      // Basic formatting for common languages
      let code = textarea.value;
      
      switch (language) {
        case 'json':
          try {
            code = JSON.stringify(JSON.parse(code), null, 2);
          } catch (e) {
            console.warn('Invalid JSON for formatting');
          }
          break;
        case 'javascript':
        case 'typescript':
          // Basic formatting (simplified)
          code = this.formatJavaScript(code);
          break;
      }
      
      textarea.value = code;
      this.updatePreview();
    };
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this.modal || this.modal.style.display === 'none') return;

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }

      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.save();
      }

      // Markdown shortcuts
      if (document.getElementById('content-text') && document.activeElement === document.getElementById('content-text')) {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'b':
              e.preventDefault();
              window.insertMarkdown('**', '**');
              break;
            case 'i':
              e.preventDefault();
              window.insertMarkdown('*', '*');
              break;
            case 'k':
              e.preventDefault();
              window.insertMarkdown('[', '](url)');
              break;
          }
        }
      }
    });
  }

  setupLivePreview() {
    const updatePreview = () => {
      const preview = document.getElementById('preview-content');
      if (preview) {
        preview.innerHTML = this.generateCurrentPreview();
      }
    };

    // Add event listeners based on node type
    switch (this.currentNode.type) {
      case 'text':
        const textArea = document.getElementById('content-text');
        if (textArea) {
          textArea.addEventListener('input', updatePreview);
        }
        break;
      
      case 'image':
        ['content-image-url', 'content-alt', 'content-caption'].forEach(id => {
          const input = document.getElementById(id);
          if (input) {
            input.addEventListener('input', updatePreview);
          }
        });
        break;
      
      case 'code':
        const codeArea = document.getElementById('content-code');
        const langSelect = document.getElementById('content-language');
        if (codeArea) codeArea.addEventListener('input', updatePreview);
        if (langSelect) langSelect.addEventListener('change', updatePreview);
        break;
    }
  }

  generateCurrentPreview() {
    const tempNode = { ...this.currentNode };
    
    // Get current form values
    switch (tempNode.type) {
      case 'text':
        const text = document.getElementById('content-text')?.value || '';
        tempNode.content = { ...tempNode.content, text };
        break;
      
      case 'image':
        const imageUrl = document.getElementById('content-image-url')?.value || '';
        const alt = document.getElementById('content-alt')?.value || '';
        const caption = document.getElementById('content-caption')?.value || '';
        tempNode.content = { ...tempNode.content, imageUrl, alt, caption };
        break;
      
      case 'code':
        const code = document.getElementById('content-code')?.value || '';
        const language = document.getElementById('content-language')?.value || 'javascript';
        tempNode.content = { ...tempNode.content, code, language };
        break;
    }

    // Use current node for preview generation
    const originalNode = this.currentNode;
    this.currentNode = tempNode;
    const preview = this.renderPreview();
    this.currentNode = originalNode;
    
    return preview;
  }

  save() {
    if (!this.currentNode) return;

    const content = this.extractContentFromForm();
    this.onSave(content);
    this.close();
  }

  cancel() {
    this.onCancel();
    this.close();
  }

  extractContentFromForm() {
    switch (this.currentNode.type) {
      case 'text':
        return {
          text: document.getElementById('content-text')?.value || ''
        };
      
      case 'image':
        return {
          imageUrl: document.getElementById('content-image-url')?.value || '',
          alt: document.getElementById('content-alt')?.value || '',
          caption: document.getElementById('content-caption')?.value || ''
        };
      
      case 'code':
        return {
          code: document.getElementById('content-code')?.value || '',
          language: document.getElementById('content-language')?.value || 'javascript'
        };
      
      default:
        return {};
    }
  }

  getNodeTypeTitle(type) {
    const titles = {
      text: 'Text',
      image: 'Image',
      code: 'Code',
      media: 'Media'
    };
    return titles[type] || type;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Image handling methods
  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image file is too large. Please choose a file under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      // Update the URL input
      document.getElementById('content-image-url').value = imageUrl;
      
      // Switch to URL tab to show the result
      window.switchImageTab('url');
      
      // Update preview
      this.updatePreview();
      
      // Show success message
      this.showUploadSuccess();
    };
    
    reader.readAsDataURL(file);
  }

  showUploadSuccess() {
    const dropZone = document.getElementById('image-drop-zone');
    if (dropZone) {
      const originalContent = dropZone.innerHTML;
      dropZone.innerHTML = `
        <div class="drop-zone-content success">
          <div class="drop-icon">✅</div>
          <p><strong>Image uploaded successfully!</strong></p>
          <p>Check the URL tab to see the result</p>
        </div>
      `;
      
      setTimeout(() => {
        dropZone.innerHTML = originalContent;
      }, 2000);
    }
  }

  // Code formatting methods
  formatJavaScript(code) {
    // Basic JavaScript formatting
    return code
      .replace(/;/g, ';\n')
      .replace(/\{/g, ' {\n  ')
      .replace(/\}/g, '\n}')
      .replace(/,/g, ',\n  ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  // Enhanced preview update
  updatePreview() {
    const preview = document.getElementById('preview-content');
    if (preview) {
      preview.innerHTML = this.generateCurrentPreview();
    }
  }

  destroy() {
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
    
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}

export { ModalEditor };