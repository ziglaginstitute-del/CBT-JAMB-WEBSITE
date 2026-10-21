import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Helper to render math string using KaTeX safely
 */
function renderKaTeX(formula, displayMode = false) {
  if (!formula) return null;
  try {
    return katex.renderToString(formula.trim(), {
      displayMode,
      throwOnError: false,
      errorColor: '#38bdf8',
      output: 'html',
      strict: false,
      trust: true
    });
  } catch (err) {
    return null;
  }
}

/**
 * MathText Component
 * Renders mixed text containing LaTeX formulas:
 * - Display / Block formulas: $$...$$ or \[...\]
 * - Inline formulas: $...$ or \(...\)
 * - Bare LaTeX macros: \frac{a}{b}, \sqrt{x}, etc. without delimiters
 * - Standard plain text with seamless typography
 */
export default function MathText({ text, className = '' }) {
  const renderedSegments = useMemo(() => {
    if (text === null || text === undefined) return [];
    if (typeof text !== 'string') {
      return [String(text)];
    }

    if (!text.trim()) return [];

    // Check if the entire string is a pure bare LaTeX formula without dollar signs
    // e.g. "\frac{1}{2}" or "\sqrt{b^2 - 4ac}" or "x^2 + 2x + 1 = 0"
    const trimmed = text.trim();
    if (!trimmed.includes('$') && !trimmed.includes('\\[') && !trimmed.includes('\\(')) {
      // Check if it starts with a prominent LaTeX command
      if (/^\s*\\(?:frac|sqrt|int|sum|prod|lim|left|mathbf|mathrm|text|begin)\b/.test(trimmed)) {
        const fullRender = renderKaTeX(trimmed, false);
        if (fullRender) {
          return [
            <span
              key="bare-full"
              className="inline-block px-0.5 text-sky-300 align-middle"
              dangerouslySetInnerHTML={{ __html: fullRender }}
            />
          ];
        }
      }
    }

    // Split text by:
    // 1. $$ ... $$ (display math)
    // 2. \[ ... \] (display math)
    // 3. $ ... $ (inline math - including multiline formulas)
    // 4. \( ... \) (inline math)
    // 5. Bare prominent LaTeX expressions like \frac{...}{...} or \sqrt{...}
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[\s\S])+?\$|\\\([\s\S]*?\\\)|\\(?:frac|sqrt)\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\})/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Display math $$...$$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        const html = renderKaTeX(math, true);
        if (html) {
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-sky-300 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={index} className="font-mono text-sky-400">{part}</span>;
      }

      // 2. Display math \[...\]
      if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        const html = renderKaTeX(math, true);
        if (html) {
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-sky-300 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={index} className="font-mono text-sky-400">{part}</span>;
      }

      // 3. Inline math $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const math = part.slice(1, -1).trim();
        const html = renderKaTeX(math, false);
        if (html) {
          return (
            <span
              key={index}
              className="inline-block px-0.5 text-sky-300 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={index} className="font-mono text-sky-400">{part}</span>;
      }

      // 4. Inline math \(...\)
      if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        const html = renderKaTeX(math, false);
        if (html) {
          return (
            <span
              key={index}
              className="inline-block px-0.5 text-sky-300 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={index} className="font-mono text-sky-400">{part}</span>;
      }

      // 5. Bare LaTeX macros (e.g. \frac{1}{2} without $)
      if (part.startsWith('\\frac') || part.startsWith('\\sqrt')) {
        const html = renderKaTeX(part, false);
        if (html) {
          return (
            <span
              key={index}
              className="inline-block px-0.5 text-sky-300 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
      }

      // Regular text
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{renderedSegments}</span>;
}
