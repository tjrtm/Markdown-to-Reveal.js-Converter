/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidUrl,
  isValidEmail,
  isValidHexColor,
  validateProjectName,
  validateProject,
} from '@/utils/validation';
import type { Project } from '@/types';

describe('isValidUrl', () => {
  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('ftp://files.example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('should validate emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });
});

describe('isValidHexColor', () => {
  it('should validate hex colors', () => {
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#AbC123')).toBe(true);
  });

  it('should reject invalid hex colors', () => {
    expect(isValidHexColor('000000')).toBe(false);
    expect(isValidHexColor('#gg0000')).toBe(false);
    expect(isValidHexColor('#12345')).toBe(false);
  });
});

describe('validateProjectName', () => {
  it('should validate valid names', () => {
    const result = validateProjectName('My Project');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty names', () => {
    const result = validateProjectName('');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('REQUIRED');
  });

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(101);
    const result = validateProjectName(longName);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MAX_LENGTH')).toBe(true);
  });

  it('should warn about short names', () => {
    const result = validateProjectName('ab');
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe('MIN_LENGTH');
  });
});

describe('validateProject', () => {
  const validProject: Project = {
    id: 'test-1',
    name: 'Test Project',
    mode: 'quick',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '2.0.0',
    slides: [
      {
        id: 'slide-1',
        content: 'Test content',
        order: 0,
      },
    ],
    globalOptions: {},
  };

  it('should validate valid projects', () => {
    const result = validateProject(validProject);
    expect(result.valid).toBe(true);
  });

  it('should warn about empty slides', () => {
    const project = { ...validProject, slides: [] };
    const result = validateProject(project);
    expect(result.warnings.some((w) => w.code === 'EMPTY_SLIDES')).toBe(true);
  });

  it('should reject invalid background colors', () => {
    const project = {
      ...validProject,
      globalOptions: { backgroundColor: 'invalid' },
    };
    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_COLOR')).toBe(true);
  });

  it('should reject invalid background image URLs', () => {
    const project = {
      ...validProject,
      globalOptions: { backgroundImage: 'not-a-url' },
    };
    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_URL')).toBe(true);
  });
});
