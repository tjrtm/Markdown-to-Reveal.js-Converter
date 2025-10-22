/**
 * Validation utilities
 */

import type { ValidationResult, ValidationError, ValidationWarning, Project } from '@/types';

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Project name is required',
      code: 'REQUIRED',
    });
  }

  if (name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Project name must be less than 100 characters',
      code: 'MAX_LENGTH',
    });
  }

  if (name.length < 3) {
    warnings.push({
      field: 'name',
      message: 'Project name should be at least 3 characters',
      code: 'MIN_LENGTH',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate project
 */
export function validateProject(project: Project): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate name
  const nameValidation = validateProjectName(project.name);
  errors.push(...nameValidation.errors);
  warnings.push(...nameValidation.warnings);

  // Validate slides
  if (!project.slides || project.slides.length === 0) {
    warnings.push({
      field: 'slides',
      message: 'Project has no slides',
      code: 'EMPTY_SLIDES',
    });
  }

  // Validate slide content
  project.slides.forEach((slide, index) => {
    if (!slide.content || slide.content.trim().length === 0) {
      warnings.push({
        field: `slides[${index}].content`,
        message: `Slide ${index + 1} has no content`,
        code: 'EMPTY_CONTENT',
      });
    }

    if (slide.content.length > 10000) {
      warnings.push({
        field: `slides[${index}].content`,
        message: `Slide ${index + 1} has very long content (${slide.content.length} chars)`,
        code: 'LONG_CONTENT',
      });
    }
  });

  // Validate nodes (if in advanced mode)
  if (project.nodes && project.nodes.length > 0) {
    project.nodes.forEach((node, index) => {
      if (!node.content || node.content.trim().length === 0) {
        warnings.push({
          field: `nodes[${index}].content`,
          message: `Node ${index + 1} has no content`,
          code: 'EMPTY_CONTENT',
        });
      }

      if (node.width <= 0 || node.height <= 0) {
        errors.push({
          field: `nodes[${index}].dimensions`,
          message: `Node ${index + 1} has invalid dimensions`,
          code: 'INVALID_DIMENSIONS',
        });
      }
    });
  }

  // Validate background image URLs
  if (project.globalOptions.backgroundImage) {
    if (!isValidUrl(project.globalOptions.backgroundImage)) {
      errors.push({
        field: 'globalOptions.backgroundImage',
        message: 'Background image URL is invalid',
        code: 'INVALID_URL',
      });
    }
  }

  // Validate background color
  if (
    project.globalOptions.backgroundColor &&
    !isValidHexColor(project.globalOptions.backgroundColor)
  ) {
    errors.push({
      field: 'globalOptions.backgroundColor',
      message: 'Background color must be a valid hex color',
      code: 'INVALID_COLOR',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB = 10): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    errors.push({
      field: 'file.size',
      message: `File size exceeds ${maxSizeMB}MB limit`,
      code: 'FILE_TOO_LARGE',
    });
  }

  if (file.size > maxSizeBytes * 0.8) {
    warnings.push({
      field: 'file.size',
      message: `File size is approaching the ${maxSizeMB}MB limit`,
      code: 'FILE_SIZE_WARNING',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file.type',
      message: `File type ${file.type} is not allowed`,
      code: 'INVALID_FILE_TYPE',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
