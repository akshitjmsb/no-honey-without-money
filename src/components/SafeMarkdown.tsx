import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safe markdown renderer that prevents XSS attacks
 * This is a simple implementation that safely converts newlines to <br> tags
 * and escapes HTML content to prevent XSS attacks
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ 
  content, 
  className = '' 
}) => {
  // Escape HTML to prevent XSS attacks
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Convert newlines to <br> tags safely
  const formatContent = (text: string): string => {
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3 headers
      .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2 headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1 headers
      .replace(/^\* (.*$)/gm, '<li>$1</li>') // List items
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>'); // Wrap list items in ul
  };

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: formatContent(content) 
      }}
    />
  );
};
