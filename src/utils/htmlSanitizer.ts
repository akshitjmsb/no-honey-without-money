/**
 * HTML sanitization utility to prevent XSS attacks
 */

// Allowed HTML tags for safe rendering
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'span', 'div'
];

// Allowed attributes for specific tags
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target'],
  'code': ['class'],
  'pre': ['class'],
  'div': ['class'],
  'span': ['class']
};

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove script tags and their content
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove style tags and their content
  const styles = temp.querySelectorAll('style');
  styles.forEach(style => style.remove());

  // Remove dangerous attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove all attributes first
    const attributes = Array.from(element.attributes);
    attributes.forEach(attr => {
      element.removeAttribute(attr.name);
    });

    // Add back only allowed attributes
    const tagName = element.tagName.toLowerCase();
    if (ALLOWED_ATTRIBUTES[tagName]) {
      ALLOWED_ATTRIBUTES[tagName].forEach(attr => {
        const originalValue = element.getAttribute(attr);
        if (originalValue) {
          element.setAttribute(attr, originalValue);
        }
      });
    }
  });

  return temp.innerHTML;
};

/**
 * Converts plain text to safe HTML with basic formatting
 * @param text - Plain text to convert
 * @returns Safe HTML string
 */
export const textToSafeHtml = (text: string): string => {
  // First escape any existing HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Apply basic formatting
  const formatted = escaped
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Sanitize the result
  return sanitizeHtml(formatted);
};
