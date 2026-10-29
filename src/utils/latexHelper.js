/**
 * ============================================================================
 * PREPCBT LATEX & MATHEMATICAL EQUATION FORMATTING ENGINE
 * Provides automatic heuristic conversion of plain math expressions to KaTeX,
 * and standard mathematical formula templates for STEM CBT examinations.
 * ============================================================================
 */

export const LATEX_SNIPPETS = [
  { label: 'a/b', latex: '\\frac{a}{b}', title: 'Fraction' },
  { label: '√x', latex: '\\sqrt{x}', title: 'Square Root' },
  { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', title: 'Nth Root' },
  { label: 'x²', latex: 'x^{2}', title: 'Superscript / Exponent' },
  { label: 'x₁', latex: 'x_{1}', title: 'Subscript' },
  { label: 'θ', latex: '\\theta', title: 'Theta' },
  { label: 'π', latex: '\\pi', title: 'Pi' },
  { label: '±', latex: '\\pm', title: 'Plus-Minus' },
  { label: '≤', latex: '\\le', title: 'Less Than or Equal' },
  { label: '≥', latex: '\\ge', title: 'Greater Than or Equal' },
  { label: '≠', latex: '\\ne', title: 'Not Equal' },
  { label: '×', latex: '\\times', title: 'Multiplication Sign' },
  { label: '÷', latex: '\\div', title: 'Division Sign' },
  { label: '°', latex: '^{\\circ}', title: 'Degrees' },
  { label: '∫', latex: '\\int_{a}^{b} f(x) \\, dx', title: 'Definite Integral' },
  { label: '∑', latex: '\\sum_{i=1}^{n} x_i', title: 'Summation' },
  { label: 'lim', latex: '\\lim_{x \\to 0}', title: 'Limit' },
  { label: 'α', latex: '\\alpha', title: 'Alpha' },
  { label: 'β', latex: '\\beta', title: 'Beta' },
  { label: 'λ', latex: '\\lambda', title: 'Lambda' }
];

/**
 * Automatically converts common plain-text mathematical notations
 * (e.g. "x^2", "sqrt(x)", "1/2", "theta", "<=") into valid KaTeX LaTeX ($...$)
 */
export const autoFormatLatexString = (input) => {
  if (!input || typeof input !== 'string') return input || '';

  let text = input;

  // 1. If text is already wrapped in $$...$$ or $...$, preserve existing valid LaTeX
  // We only transform parts that are NOT already inside $...$ or $$...$$
  const segments = text.split(/(\$\$[\s\S]*?\$\$|\$(?:\\\$|[\s\S])+?\$)/g);

  const formattedSegments = segments.map((seg) => {
    // If already in LaTeX delimiters, keep as is
    if (seg.startsWith('$') && seg.endsWith('$')) {
      return seg;
    }

    let s = seg;

    // Convert common words / symbols to LaTeX
    // Square roots: sqrt(...) -> \sqrt{...}
    s = s.replace(/\bsqrt\(([^)]+)\)/gi, '$\\sqrt{$1}$');

    // Simple fractions: e.g. 1/2, 3/4, a/b surrounded by space or punctuation
    s = s.replace(/(?<=\s|^|\()([0-9a-zA-Z]+)\s*\/\s*([0-9a-zA-Z]+)(?=\s|$|\)|\.|\,)/g, '$\\frac{$1}{$2}$');

    // Exponents: e.g. x^2, y^3, 10^5, (x+1)^2
    s = s.replace(/(?<=\s|^|\()([a-zA-Z0-9]+|\([^\)]+\))\^([a-zA-Z0-9]+|\{[^\}]+\})(?=\s|$|\)|\.|\,)/g, (match, base, exp) => {
      const cleanExp = exp.startsWith('{') && exp.endsWith('}') ? exp : `{${exp}}`;
      return `$${base}^${cleanExp}$`;
    });

    // Subscripts: e.g. x_1, H_2O
    s = s.replace(/(?<=\s|^|\()([a-zA-Z]+)_([0-9a-zA-Z]+)(?=\s|$|\)|\.|\,)/g, '$$$1_{$2}$$');

    // Inequalities & Operators
    s = s.replace(/\s*<=\s*/g, ' $\\le$ ');
    s = s.replace(/\s*>=\s*/g, ' $\\ge$ ');
    s = s.replace(/\s*!=\s*/g, ' $\\ne$ ');
    s = s.replace(/\s*\+-\s*/g, ' $\\pm$ ');

    // Greek letters when written as standalone words
    s = s.replace(/\btheta\b/gi, '$\\theta$');
    s = s.replace(/\bpi\b(?!\w)/gi, '$\\pi$');
    s = s.replace(/\balpha\b/gi, '$\\alpha$');
    s = s.replace(/\bbeta\b/gi, '$\\beta$');
    s = s.replace(/\blambda\b/gi, '$\\lambda$');
    s = s.replace(/\bdelta\b/gi, '$\\Delta$');

    // Clean up consecutive or redundant dollars e.g. $$x$$ -> $x$
    s = s.replace(/\$\s*\$/g, ' ');

    return s;
  });

  return formattedSegments.join('');
};

/**
 * Deeply formats all question fields (stem, options, hint, explanation) to LaTeX
 */
export const autoFormatQuestionToLatex = (q) => {
  if (!q) return q;

  const formattedOptions = (q.options || []).map(opt => ({
    ...opt,
    text: autoFormatLatexString(opt.text || '')
  }));

  return {
    ...q,
    question: autoFormatLatexString(q.question || ''),
    options: formattedOptions,
    hint: q.hint ? autoFormatLatexString(q.hint) : '',
    explanation: q.explanation ? autoFormatLatexString(q.explanation) : ''
  };
};
