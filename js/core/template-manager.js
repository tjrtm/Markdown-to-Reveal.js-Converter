/**
 * Template Manager
 * Handles presentation templates, themes, and pre-built layouts
 */

class TemplateManager {
  constructor(options = {}) {
    this.onTemplateApply = options.onTemplateApply || (() => {});
    this.onThemeChange = options.onThemeChange || (() => {});
    
    this.templates = new Map();
    this.themes = new Map();
    this.currentTheme = 'dark';
    
    this.initializeBuiltInTemplates();
    this.initializeBuiltInThemes();
  }

  initializeBuiltInTemplates() {
    // Business presentation template
    this.registerTemplate('business-pitch', {
      name: 'Business Pitch',
      description: 'Professional business presentation with title, problem, solution, and conclusion',
      category: 'business',
      thumbnail: '📊',
      nodes: [
        {
          type: 'text',
          position: { x: 100, y: 100 },
          size: { width: 300, height: 200 },
          content: {
            text: '# Company Presentation\n\n**Your Company Name**\n\nTransforming the future of [industry]'
          },
          style: {
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          position: { x: 500, y: 100 },
          size: { width: 300, height: 200 },
          content: {
            text: '# The Problem\n\n- Current market pain points\n- Inefficiencies in existing solutions\n- Growing market demand'
          },
          style: {
            backgroundColor: '#dc2626',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 900, y: 100 },
          size: { width: 300, height: 200 },
          content: {
            text: '# Our Solution\n\n✅ Innovative approach\n✅ Proven technology\n✅ Scalable architecture\n✅ Cost-effective'
          },
          style: {
            backgroundColor: '#059669',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 300, y: 400 },
          size: { width: 500, height: 200 },
          content: {
            text: '# Market Opportunity\n\n- **Total Addressable Market**: $XX billion\n- **Growth Rate**: XX% annually\n- **Target Customers**: Enterprise & SMB'
          },
          style: {
            backgroundColor: '#7c3aed',
            color: '#ffffff'
          }
        }
      ],
      connections: [
        { startNodeId: 'node-1', endNodeId: 'node-2', type: 'flow' },
        { startNodeId: 'node-2', endNodeId: 'node-3', type: 'flow' },
        { startNodeId: 'node-3', endNodeId: 'node-4', type: 'flow' }
      ]
    });

    // Educational template
    this.registerTemplate('educational-lesson', {
      name: 'Educational Lesson',
      description: 'Structured educational content with introduction, main topics, and summary',
      category: 'education',
      thumbnail: '🎓',
      nodes: [
        {
          type: 'text',
          position: { x: 200, y: 50 },
          size: { width: 400, height: 150 },
          content: {
            text: '# Lesson Title\n\n**Learning Objectives:**\n- Understand key concepts\n- Apply practical skills\n- Connect to real-world examples'
          },
          style: {
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          position: { x: 50, y: 300 },
          size: { width: 250, height: 180 },
          content: {
            text: '# Topic 1: Fundamentals\n\n- Core concepts\n- Basic principles\n- Foundation knowledge'
          },
          style: {
            backgroundColor: '#f59e0b',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 350, y: 300 },
          size: { width: 250, height: 180 },
          content: {
            text: '# Topic 2: Applications\n\n- Practical examples\n- Use cases\n- Real-world scenarios'
          },
          style: {
            backgroundColor: '#10b981',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 650, y: 300 },
          size: { width: 250, height: 180 },
          content: {
            text: '# Topic 3: Advanced\n\n- Complex concepts\n- Expert techniques\n- Future directions'
          },
          style: {
            backgroundColor: '#8b5cf6',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 200, y: 550 },
          size: { width: 400, height: 150 },
          content: {
            text: '# Summary & Next Steps\n\n✓ Key takeaways\n✓ Action items\n✓ Additional resources'
          },
          style: {
            backgroundColor: '#374151',
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ],
      connections: [
        { startNodeId: 'node-1', endNodeId: 'node-2', type: 'flow' },
        { startNodeId: 'node-1', endNodeId: 'node-3', type: 'flow' },
        { startNodeId: 'node-1', endNodeId: 'node-4', type: 'flow' },
        { startNodeId: 'node-2', endNodeId: 'node-5', type: 'flow' },
        { startNodeId: 'node-3', endNodeId: 'node-5', type: 'flow' },
        { startNodeId: 'node-4', endNodeId: 'node-5', type: 'flow' }
      ]
    });

    // Product showcase template
    this.registerTemplate('product-showcase', {
      name: 'Product Showcase',
      description: 'Product presentation with features, benefits, and call-to-action',
      category: 'marketing',
      thumbnail: '🚀',
      nodes: [
        {
          type: 'text',
          position: { x: 300, y: 100 },
          size: { width: 400, height: 200 },
          content: {
            text: '# Introducing [Product Name]\n\n*Revolutionary solution for modern challenges*\n\n**Transform your workflow today**'
          },
          style: {
            backgroundColor: '#1f2937',
            color: '#ffffff',
            textAlign: 'center'
          }
        },
        {
          type: 'image',
          position: { x: 100, y: 350 },
          size: { width: 300, height: 200 },
          content: {
            imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Product+Hero',
            alt: 'Product hero image',
            caption: 'Beautiful, intuitive design'
          }
        },
        {
          type: 'text',
          position: { x: 500, y: 350 },
          size: { width: 300, height: 200 },
          content: {
            text: '# Key Features\n\n🔥 **Fast & Reliable**\n⚡ **Easy to Use**\n🛡️ **Secure & Private**\n🎯 **Results-Driven**'
          },
          style: {
            backgroundColor: '#059669',
            color: '#ffffff'
          }
        },
        {
          type: 'text',
          position: { x: 900, y: 350 },
          size: { width: 300, height: 200 },
          content: {
            text: '# Get Started Today\n\n**Free 30-day trial**\n\n• No credit card required\n• Full feature access\n• 24/7 support included'
          },
          style: {
            backgroundColor: '#dc2626',
            color: '#ffffff',
            textAlign: 'center'
          }
        }
      ],
      connections: [
        { startNodeId: 'node-1', endNodeId: 'node-2', type: 'flow' },
        { startNodeId: 'node-2', endNodeId: 'node-3', type: 'flow' },
        { startNodeId: 'node-3', endNodeId: 'node-4', type: 'flow' }
      ]
    });

    // Technical documentation template
    this.registerTemplate('technical-docs', {
      name: 'Technical Documentation',
      description: 'Technical presentation with architecture, implementation, and examples',
      category: 'technical',
      thumbnail: '⚙️',
      nodes: [
        {
          type: 'text',
          position: { x: 200, y: 100 },
          size: { width: 600, height: 150 },
          content: {
            text: '# Technical Overview\n\n**System Architecture & Implementation Guide**\n\nVersion 1.0 | Engineering Team'
          },
          style: {
            backgroundColor: '#374151',
            color: '#ffffff',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          position: { x: 100, y: 300 },
          size: { width: 350, height: 200 },
          content: {
            text: '# Architecture\n\n- **Frontend**: React/Vue.js\n- **Backend**: Node.js/Python\n- **Database**: PostgreSQL\n- **Cache**: Redis\n- **Infrastructure**: Docker/K8s'
          },
          style: {
            backgroundColor: '#1e40af',
            color: '#ffffff'
          }
        },
        {
          type: 'code',
          position: { x: 550, y: 300 },
          size: { width: 350, height: 200 },
          content: {
            code: `// Example API endpoint
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
            language: 'javascript'
          }
        },
        {
          type: 'text',
          position: { x: 300, y: 550 },
          size: { width: 400, height: 150 },
          content: {
            text: '# Implementation Notes\n\n• Follow coding standards\n• Comprehensive testing required\n• Monitor performance metrics\n• Document all changes'
          },
          style: {
            backgroundColor: '#7c2d12',
            color: '#ffffff'
          }
        }
      ],
      connections: [
        { startNodeId: 'node-1', endNodeId: 'node-2', type: 'flow' },
        { startNodeId: 'node-1', endNodeId: 'node-3', type: 'flow' },
        { startNodeId: 'node-2', endNodeId: 'node-4', type: 'flow' },
        { startNodeId: 'node-3', endNodeId: 'node-4', type: 'flow' }
      ]
    });
  }

  initializeBuiltInThemes() {
    // Dark theme (default)
    this.registerTheme('dark', {
      name: 'Dark Professional',
      description: 'Dark theme with blue accents',
      colors: {
        primary: '#007acc',
        secondary: '#0056b3',
        background: '#1a1a1a',
        surface: '#2a2a2a',
        text: '#e0e0e0',
        textSecondary: '#aaa',
        border: '#444',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        monospace: '"SF Mono", Monaco, "Cascadia Code", monospace'
      },
      spacing: {
        unit: 8,
        small: 12,
        medium: 16,
        large: 24,
        xl: 32
      }
    });

    // Light theme
    this.registerTheme('light', {
      name: 'Light Professional',
      description: 'Clean light theme with subtle shadows',
      colors: {
        primary: '#1976d2',
        secondary: '#1565c0',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#212121',
        textSecondary: '#757575',
        border: '#e0e0e0',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        monospace: '"SF Mono", Monaco, "Cascadia Code", monospace'
      },
      spacing: {
        unit: 8,
        small: 12,
        medium: 16,
        large: 24,
        xl: 32
      }
    });

    // High contrast theme
    this.registerTheme('high-contrast', {
      name: 'High Contrast',
      description: 'High contrast theme for accessibility',
      colors: {
        primary: '#ffff00',
        secondary: '#ff00ff',
        background: '#000000',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        border: '#666666',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        monospace: '"SF Mono", Monaco, "Cascadia Code", monospace'
      },
      spacing: {
        unit: 8,
        small: 12,
        medium: 16,
        large: 24,
        xl: 32
      }
    });

    // Minimal theme
    this.registerTheme('minimal', {
      name: 'Minimal',
      description: 'Clean minimal design with subtle colors',
      colors: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#374151',
        textSecondary: '#6b7280',
        border: '#d1d5db',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      fonts: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        monospace: '"JetBrains Mono", "SF Mono", Monaco, monospace'
      },
      spacing: {
        unit: 6,
        small: 10,
        medium: 14,
        large: 20,
        xl: 28
      }
    });
  }

  registerTemplate(id, template) {
    this.templates.set(id, {
      ...template,
      id,
      created: new Date().toISOString()
    });
  }

  registerTheme(id, theme) {
    this.themes.set(id, {
      ...theme,
      id,
      created: new Date().toISOString()
    });
  }

  getTemplates(category = null) {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(template => template.category === category);
    }
    return templates;
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  getTemplateCategories() {
    const categories = new Set();
    this.templates.forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return Array.from(categories);
  }

  getThemes() {
    return Array.from(this.themes.values());
  }

  getTheme(id) {
    return this.themes.get(id);
  }

  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  applyTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Generate unique IDs for nodes and update connections
    const nodeIdMap = new Map();
    const nodes = template.nodes.map((node, index) => {
      const newId = `node-${Date.now()}-${index}`;
      const oldId = `node-${index + 1}`;
      nodeIdMap.set(oldId, newId);
      
      return {
        ...node,
        id: newId,
        metadata: {
          ...node.metadata,
          templateId,
          templateNode: oldId
        }
      };
    });

    // Update connection IDs
    const connections = (template.connections || []).map(conn => ({
      ...conn,
      id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startNodeId: nodeIdMap.get(conn.startNodeId) || conn.startNodeId,
      endNodeId: nodeIdMap.get(conn.endNodeId) || conn.endNodeId
    }));

    const templateData = {
      template,
      nodes,
      connections,
      metadata: {
        appliedAt: new Date().toISOString(),
        templateId,
        templateName: template.name
      }
    };

    this.onTemplateApply(templateData);
    return templateData;
  }

  applyTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    this.currentTheme = themeId;
    this.updateCSSVariables(theme);
    this.onThemeChange(theme);
    
    return theme;
  }

  updateCSSVariables(theme) {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply font variables
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`);
    });
  }

  createCustomTemplate(templateData) {
    const id = `custom-${Date.now()}`;
    const template = {
      ...templateData,
      id,
      category: 'custom',
      created: new Date().toISOString(),
      custom: true
    };

    this.registerTemplate(id, template);
    return template;
  }

  createCustomTheme(themeData) {
    const id = `custom-${Date.now()}`;
    const theme = {
      ...themeData,
      id,
      created: new Date().toISOString(),
      custom: true
    };

    this.registerTheme(id, theme);
    return theme;
  }

  exportTemplate(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return {
      type: 'presentation-template',
      version: '1.0',
      template,
      exported: new Date().toISOString()
    };
  }

  importTemplate(templateData) {
    if (templateData.type !== 'presentation-template') {
      throw new Error('Invalid template format');
    }

    const template = templateData.template;
    const id = template.custom ? template.id : `imported-${Date.now()}`;
    
    this.registerTemplate(id, {
      ...template,
      id,
      imported: true,
      importedAt: new Date().toISOString()
    });

    return id;
  }

  searchTemplates(query) {
    const searchQuery = query.toLowerCase();
    return this.getTemplates().filter(template => 
      template.name.toLowerCase().includes(searchQuery) ||
      template.description.toLowerCase().includes(searchQuery) ||
      template.category?.toLowerCase().includes(searchQuery)
    );
  }

  getTemplateStats() {
    const templates = this.getTemplates();
    const categories = this.getTemplateCategories();
    
    return {
      total: templates.length,
      categories: categories.length,
      custom: templates.filter(t => t.custom).length,
      builtin: templates.filter(t => !t.custom).length,
      byCategory: categories.reduce((acc, cat) => {
        acc[cat] = templates.filter(t => t.category === cat).length;
        return acc;
      }, {})
    };
  }
}

export { TemplateManager };