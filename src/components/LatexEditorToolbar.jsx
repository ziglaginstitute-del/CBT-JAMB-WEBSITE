import React from 'react';
import { Sparkles, HelpCircle, Check, Eye } from 'lucide-react';
import { LATEX_SNIPPETS, autoFormatLatexString } from '../utils/latexHelper';
import MathText from './MathText';

export default function LatexEditorToolbar({ 
  onInsertLatex, 
  onAutoFormat, 
  previewText = null,
  showPreview = true,
  compact = false 
}) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
          <Sparkles size={13} />
          <span>LaTeX Math & Formula Helpers:</span>
        </div>

        {onAutoFormat && (
          <button
            type="button"
            onClick={onAutoFormat}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition shadow-sm"
            title="Automatically detect fractions, exponents (x^2), square roots (sqrt), and symbols, converting them into standard LaTeX"
          >
            <Sparkles size={12} />
            <span>Auto-Format Math to LaTeX</span>
          </button>
        )}
      </div>

      {/* Snippet Buttons */}
      <div className="flex flex-wrap items-center gap-1">
        {LATEX_SNIPPETS.map((snip) => (
          <button
            key={snip.label}
            type="button"
            onClick={() => onInsertLatex && onInsertLatex(snip.latex)}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md text-[11px] font-mono text-slate-200 hover:text-sky-300 transition"
            title={`Insert ${snip.title}: ${snip.latex}`}
          >
            {snip.label}
          </button>
        ))}
      </div>

      {/* Live Formula Preview */}
      {showPreview && previewText && previewText.trim() && (
        <div className="mt-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Eye size={11} className="text-sky-400" />
            <span>Live KaTeX Mathematical Preview:</span>
          </div>
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs sm:text-sm text-slate-100 overflow-x-auto min-h-[36px]">
            <MathText text={previewText} />
          </div>
        </div>
      )}
    </div>
  );
}
