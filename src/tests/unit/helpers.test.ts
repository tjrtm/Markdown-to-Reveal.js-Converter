/**
 * Unit tests for helper utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  debounce,
  deepClone,
  deepMerge,
  formatFileSize,
  formatDate,
  clamp,
  isEmpty,
  sanitizeFilename,
  getContrastColor,
} from '@/utils/helpers';

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should include prefix when provided', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-/);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, [3, 4]];
    const cloned = deepClone(arr);

    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone dates', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);

    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });
});

describe('deepMerge', () => {
  it('should merge objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 } as any, e: 4 };
    const result = deepMerge(target as any, source);

    expect(result).toMatchObject({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4,
    });
  });

  it('should handle multiple sources', () => {
    const target = { a: 1 } as any;
    const source1 = { b: 2 } as any;
    const source2 = { c: 3 } as any;
    const result = deepMerge(target, source1, source2);

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should handle decimal values', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2621440)).toBe('2.5 MB');
  });
});

describe('formatDate', () => {
  it('should format date in short format', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const formatted = formatDate(timestamp, 'short');
    expect(formatted).toMatch(/2024/);
    expect(formatted).toMatch(/Jan/);
  });

  it('should format date in long format', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const formatted = formatDate(timestamp, 'long');
    expect(formatted).toMatch(/2024/);
    expect(formatted).toMatch(/January/);
  });
});

describe('clamp', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('isEmpty', () => {
  it('should detect empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('should detect non-empty values', () => {
    expect(isEmpty('text')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('should sanitize filenames', () => {
    expect(sanitizeFilename('Hello World')).toBe('hello_world');
    expect(sanitizeFilename('File@#$Name')).toBe('file___name');
    expect(sanitizeFilename('test/file\\name')).toBe('test_file_name');
  });
});

describe('getContrastColor', () => {
  it('should return white for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff');
    expect(getContrastColor('#333333')).toBe('#ffffff');
  });

  it('should return black for light colors', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000');
    expect(getContrastColor('#f0f0f0')).toBe('#000000');
  });
});
