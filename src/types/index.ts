/**
 * Core type definitions for PresentFlow Pro
 */

export type Mode = 'quick' | 'advanced';

export type Theme =
  | 'dark'
  | 'light'
  | 'auto'
  | 'high-contrast'
  | 'minimal'
  | 'neon'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'midnight';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'convex'
  | 'concave'
  | 'zoom'
  | 'cube'
  | 'page'
  | 'linear';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export type NodeType = 'text' | 'image' | 'code' | 'heading' | 'list' | 'table' | 'chart';

export type EngineType = 'reveal' | 'impress' | 'spectacle';

export type ExportFormat = 'html' | 'pdf' | 'pptx' | 'json' | 'markdown';

export interface SlideOptions {
  backgroundColor?: string;
  backgroundImage?: string;
  transition?: TransitionType;
  textAlign?: TextAlignment;
  fontSize?: number;
  theme?: Theme;
}

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles?: Partial<CSSStyleDeclaration>;
  metadata?: Record<string, unknown>;
  locked?: boolean;
  visible?: boolean;
  order?: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type?: 'linear' | 'bezier' | 'orthogonal';
  style?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

export interface Slide {
  id: string;
  content: string;
  notes?: string;
  options?: SlideOptions;
  order: number;
  verticalSlides?: Slide[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  mode: Mode;
  createdAt: number;
  updatedAt: number;
  version: string;
  slides: Slide[];
  nodes?: Node[];
  connections?: Connection[];
  globalOptions: SlideOptions;
  engine?: EngineType;
  metadata?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  slides: Slide[];
  preview?: string;
  tags?: string[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    code: string;
  };
  spacing: {
    base: number;
  };
}

export interface AppState {
  currentProject: Project | null;
  mode: Mode;
  theme: Theme;
  selectedNodes: string[];
  clipboard: Node[];
  history: {
    past: Project[];
    future: Project[];
  };
  ui: {
    sidebarOpen: boolean;
    propertiesPanelOpen: boolean;
    templateGalleryOpen: boolean;
    isPresenting: boolean;
    zoom: number;
    pan: { x: number; y: number };
  };
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    gridSnap: boolean;
    gridSize: number;
    showGrid: boolean;
    defaultEngine: EngineType;
    theme: Theme;
  };
}

export interface ExportOptions {
  format: ExportFormat;
  includeNotes?: boolean;
  quality?: 'low' | 'medium' | 'high';
  pageSize?: 'A4' | 'Letter' | '16:9' | '4:3';
  standalone?: boolean;
  minify?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
}

// Event types
export type StateChangeEvent = CustomEvent<{ state: AppState }>;
export type NodeSelectEvent = CustomEvent<{ nodeIds: string[] }>;
export type ProjectSaveEvent = CustomEvent<{ project: Project }>;
export type ExportCompleteEvent = CustomEvent<{ format: ExportFormat; blob: Blob }>;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<T = void> = (...args: unknown[]) => Promise<T>;

export type EventCallback<T = unknown> = (event: T) => void;
