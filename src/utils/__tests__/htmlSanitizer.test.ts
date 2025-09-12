import { describe, it, expect } from 'vitest';
import { sanitizeHtml, textToSafeHtml } from '../htmlSanitizer';

describe('htmlSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<div>Safe content</div><script>alert("xss")</script>';
      const result = sanitizeHtml(maliciousHtml);
      expect(result).toBe('<div>Safe content</div>');
    });

    it('should remove style tags', () => {
      const htmlWithStyle = '<div>Content</div><style>body { color: red; }</style>';
      const result = sanitizeHtml(htmlWithStyle);
      expect(result).toBe('<div>Content</div>');
    });

    it('should preserve allowed tags', () => {
      const safeHtml = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p>';
      const result = sanitizeHtml(safeHtml);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Paragraph with <strong>bold</strong> text</p>');
    });

    it('should remove dangerous attributes', () => {
      const htmlWithDangerousAttr = '<div onclick="alert(\'xss\')" class="safe">Content</div>';
      const result = sanitizeHtml(htmlWithDangerousAttr);
      expect(result).toContain('<div class="safe">Content</div>');
      expect(result).not.toContain('onclick');
    });

    it('should preserve allowed attributes', () => {
      const htmlWithAllowedAttr = '<a href="https://example.com" title="Link">Link</a>';
      const result = sanitizeHtml(htmlWithAllowedAttr);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="Link"');
    });
  });

  describe('textToSafeHtml', () => {
    it('should escape HTML characters', () => {
      const text = '<script>alert("xss")</script>';
      const result = textToSafeHtml(text);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should convert newlines to br tags', () => {
      const text = 'Line 1\nLine 2';
      const result = textToSafeHtml(text);
      expect(result).toContain('Line 1<br>Line 2');
    });

    it('should format markdown-style text', () => {
      const text = '**Bold** and *italic* text';
      const result = textToSafeHtml(text);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should format headers', () => {
      const text = '# Main Title\n## Subtitle';
      const result = textToSafeHtml(text);
      expect(result).toContain('<h1>Main Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    it('should format code blocks', () => {
      const text = 'Use `console.log()` for debugging';
      const result = textToSafeHtml(text);
      expect(result).toContain('<code>console.log()</code>');
    });

    it('should handle empty string', () => {
      const result = textToSafeHtml('');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const text = 'Price: $100 & "quoted" text';
      const result = textToSafeHtml(text);
      expect(result).toContain('Price: $100 &amp; &quot;quoted&quot; text');
    });
  });
});
