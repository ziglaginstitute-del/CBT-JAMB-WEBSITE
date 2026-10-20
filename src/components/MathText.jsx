import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * MathText Component
 * Renders mixed text containing LaTeX formulas:
 * - Display / Block formulas: $$...$$ or \[...\]
 * - Inline formulas: $...$ or \(...\)
 * - Standard plain text with seamless typography
 */
export default function MathText({ text, className = '' }) {
  const renderedSegments = useMemo(() => {
    if (!text || typeof text !== 'string') return [];

    // Regex to split by display math ($$...$$ or \[...\]) or inline math ($...$ or \(...\))
    // We match:
    // 1. $$ ... $$
    // 2. \[ ... \]
    // 3. $ ... $ (excluding escaped \$)
    // 4. \( ... \)
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$\n])+?\$|\\\([\s\S]*?\\\))/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display math $$...$$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-sky-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-sky-400">{part}</span>;
        }
      }

      // Display math \[...\]
      if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-sky-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-sky-400">{part}</span>;
        }
      }

      // Inline math $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5 text-sky-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-sky-400">{part}</span>;
        }
      }

      // Inline math \(...\)
      if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5 text-sky-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-sky-400">{part}</span>;
        }
      }

      // Regular text
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{renderedSegments}</span>;
}
