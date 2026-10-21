import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Lightbulb, Sparkles, Flag, 
  Check, ChevronLeft, ChevronRight, HelpCircle 
} from 'lucide-react';
import MathText from './MathText';

/**
 * Question Component
 * Standardized CBT Question rendering component with integrated KaTeX library support.
 * Renders LaTeX formatting in:
 * - Question prompts
 * - Passage / reading contexts
 * - Options (A, B, C, D)
 * - Hints
 * - Step-by-step explanations & solutions
 * 
 * Modes:
 * - 'exam': Official timed CBT mode (keyboard shortcuts, flagged indicator)
 * - 'practice': Interactive self-paced practice (hint toggle, check answer, solution breakdown)
 * - 'review': Result analytics breakdown (shows student choice vs correct answer, full solution)
 * - 'preview': Compact card for Question Bank and PDF imports
 */
export default function Question({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  mode = 'practice', // 'exam' | 'practice' | 'review' | 'preview'
  isAnswerChecked = false,
  onCheckAnswer,
  onNext,
  onPrev,
  isFirst = false,
  isLast = false,
  isFlagged = false,
  onToggleFlag,
  studentAnswer,
  showHintByDefault = false,
  showExplanationByDefault = false,
  disabled = false,
  subjectName,
  className = '',
  customActions = null
}) {
  const [showHint, setShowHint] = useState(showHintByDefault);

  if (!question) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No question data provided.
      </div>
    );
  }

  // Fallbacks
  const options = question.options || [];
  const correctOption = question.correctOption;
  const activeSelection = mode === 'review' ? studentAnswer : selectedOption;
  const isCorrectReview = studentAnswer === correctOption;
  const isSkippedReview = mode === 'review' && !studentAnswer;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Header Row (Question Number, Subject, Difficulty, Flag) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          {questionNumber !== undefined && (
            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-400 font-mono">
              Question {questionNumber} {totalQuestions ? `of ${totalQuestions}` : ''}
            </span>
          )}

          {subjectName && (
            <>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-medium">
                {subjectName}
              </span>
            </>
          )}

          {question.difficulty && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              question.difficulty === 'Beginner'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : question.difficulty === 'Advanced'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
            }`}>
              {question.difficulty}
            </span>
          )}

          {question.topic && (
            <span className="hidden sm:inline-block text-xs text-slate-400 italic">
              ({question.topic})
            </span>
          )}
        </div>

        {/* Right side controls: Flag for exam, Hint toggle for practice, Status for review */}
        <div className="flex items-center gap-2">
          {mode === 'exam' && onToggleFlag && (
            <button
              onClick={onToggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isFlagged
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300'
              }`}
            >
              <Flag size={14} className={isFlagged ? 'fill-amber-400 text-amber-400' : ''} />
              <span>{isFlagged ? 'Flagged [R]' : 'Flag [R]'}</span>
            </button>
          )}

          {mode === 'practice' && question.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                showHint
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/80'
              }`}
            >
              <Lightbulb size={14} className={showHint ? 'fill-amber-400 text-amber-400' : ''} />
              <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
            </button>
          )}

          {mode === 'review' && (
            <div>
              {isCorrectReview ? (
                <span className="px-2.5 py-1 rounded-md font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Correct (+1)</span>
                </span>
              ) : isSkippedReview ? (
                <span className="px-2.5 py-1 rounded-md font-bold bg-slate-800 text-slate-400 border border-slate-700 text-xs">
                  Unanswered / Skipped
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs flex items-center gap-1">
                  <XCircle size={13} />
                  <span>Incorrect (Chose {studentAnswer || 'None'})</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Hint Drawer (LaTeX Supported) */}
      {showHint && question.hint && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
          <Lightbulb size={18} className="shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-300 mr-1.5">Examination Hint:</span>
            <MathText text={question.hint} />
          </div>
        </div>
      )}

      {/* 3. Reading Passage / Context (LaTeX Supported) */}
      {question.passage && (
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/90 text-xs sm:text-sm italic text-slate-300 leading-relaxed">
          <span className="font-bold text-sky-400 not-italic mr-1.5">Reading Context / Passage:</span>
          <MathText text={question.passage} />
        </div>
      )}

      {/* 4. Main Question Prompt (LaTeX Supported) */}
      <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
        <MathText text={question.question} />
      </div>

      {/* 5. Options List (LaTeX Supported) */}
      <div className="space-y-3 pt-1">
        {options.map((opt) => {
          const isSelected = activeSelection === opt.label;
          const isCorrect = correctOption === opt.label;

          // Styling logic by mode
          let optionStyle = 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-200';
          let badgeStyle = 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white';

          if (mode === 'exam') {
            if (isSelected) {
              optionStyle = 'bg-sky-600/20 border-sky-500 text-white ring-1 ring-sky-500';
              badgeStyle = 'bg-sky-600 text-white';
            }
          } else if (mode === 'practice') {
            if (isAnswerChecked) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-500/15 border-emerald-500/70 text-emerald-200 font-medium';
                badgeStyle = 'bg-emerald-500 text-slate-950';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'bg-rose-500/15 border-rose-500/70 text-rose-200';
                badgeStyle = 'bg-rose-500 text-white';
              } else {
                optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                badgeStyle = 'bg-slate-800 text-slate-500';
              }
            } else if (isSelected) {
              optionStyle = 'bg-sky-500/20 border-sky-500 text-white ring-1 ring-sky-500';
              badgeStyle = 'bg-sky-500 text-white';
            }
          } else if (mode === 'review') {
            if (isCorrect) {
              optionStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold';
              badgeStyle = 'bg-emerald-500 text-slate-950';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
              badgeStyle = 'bg-rose-500 text-white';
            } else {
              optionStyle = 'bg-slate-950/40 border-slate-800/80 text-slate-400';
              badgeStyle = 'bg-slate-800 text-slate-500';
            }
          } else if (mode === 'preview') {
            if (isCorrect) {
              optionStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-medium';
              badgeStyle = 'bg-emerald-500 text-slate-950';
            }
          }

          const isClickable = !disabled && (mode === 'exam' || (mode === 'practice' && !isAnswerChecked));

          return (
            <button
              key={opt.label}
              type="button"
              disabled={!isClickable}
              onClick={() => onSelectOption && onSelectOption(opt.label)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${optionStyle} ${
                !isClickable ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {/* Option Key Badge */}
              <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 font-mono transition-colors ${badgeStyle}`}>
                {opt.label}
              </span>

              {/* Option Content with KaTeX Math Formatting */}
              <span className="text-sm sm:text-base pt-0.5 sm:pt-1 flex-1 leading-normal">
                <MathText text={opt.text} />
              </span>

              {/* Visual State Indicators */}
              {mode === 'exam' && isSelected && (
                <Check size={18} className="text-sky-400 shrink-0 mt-1" />
              )}
              {(mode === 'practice' && isAnswerChecked || mode === 'review') && isCorrect && (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-1" />
              )}
              {(mode === 'practice' && isAnswerChecked || mode === 'review') && isSelected && !isCorrect && (
                <XCircle size={18} className="text-rose-400 shrink-0 mt-1" />
              )}
              {mode === 'preview' && isCorrect && (
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded shrink-0 mt-1">
                  Key
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 6. Step-by-Step Solution & Official Explanation (LaTeX Supported) */}
      {((mode === 'practice' && isAnswerChecked) || (mode === 'review') || showExplanationByDefault) && question.explanation && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Sparkles size={16} />
              <span>Official Solution & Explanation</span>
            </div>
            {correctOption && (
              <span className="text-xs text-slate-300">
                Correct Option: <strong className="text-emerald-400 font-mono font-bold text-sm">[{correctOption}]</strong>
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
            <MathText text={question.explanation} />
          </div>
        </div>
      )}

      {/* 7. Action Bar for Practice Mode (Check Answer / Next) */}
      {mode === 'practice' && (
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                disabled={isFirst}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
            )}

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={isLast}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div>
            {!isAnswerChecked ? (
              <button
                type="button"
                onClick={onCheckAnswer}
                disabled={!selectedOption}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={isLast}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 disabled:opacity-40 transition flex items-center gap-1.5"
              >
                <span>Continue to Next</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom slotted actions if passed */}
      {customActions}
    </div>
  );
}

// Subcomponents export for specialized layouts
export { MathText };
