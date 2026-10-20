import React, { useState } from 'react';
import { 
  FileUp, FileText, CheckCircle2, AlertTriangle, Trash2, 
  Sparkles, RefreshCw, Edit3, ArrowRight, Check, X, Layers, Filter 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { SUBJECTS } from '../data/questions';
import { bulkAddQuestions } from '../utils/storage';
import MathText from './MathText';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

const SAMPLE_TEXT_FORMAT = `1. Which organelle is universally referred to as the powerhouse of the cell?
A. Ribosome
B. Endoplasmic reticulum
C. Mitochondrion
D. Golgi apparatus
Answer: C
Hint: Aerobic cellular respiration occurs within its inner folded cristae.
Explanation: Mitochondria generate the chemical energy (ATP) required for cellular reactions.

2. In Nigerian constitutional history, the 1979 Constitution introduced which system of government?
A. Unitary System
B. American Executive Presidential System
C. Westminster Parliamentary System
D. Confederal Union
Ans: B
Explanation: The 1979 Constitution replaced the British parliamentary cabinet model with an executive presidency.

3. Solve for x in the equation: 2(x + 4) = 3x - 1
A. x = 5
B. x = 7
C. x = 9
D. x = 11
Key: C
Hint: Expand the brackets on the left side first: 2x + 8 = 3x - 1.
Explanation: 2x + 8 = 3x - 1 => 8 + 1 = 3x - 2x => x = 9.

4. A vehicle traveling at 20 m/s accelerates uniformly at 2 m/s² for 5 seconds. What is its final velocity?
A. 25 m/s
B. 30 m/s
C. 35 m/s
D. 40 m/s
Ans: B
Explanation: Using v = u + at => v = 20 + (2 × 5) = 20 + 10 = 30 m/s.

5. What is the fundamental economic problem faced by every human society?
A. High interest rates
B. Scarcity of resources relative to unlimited wants
C. Excess supply of goods
D. Rapid devaluation of currency
Answer: B
Explanation: Scarcity is universal because human desires exceed available economic resources.`;

export default function PDFQuestionUploader({ onImportComplete, onCancel }) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'text'
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [targetSubject, setTargetSubject] = useState('english');
  const [defaultDifficulty, setDefaultDifficulty] = useState('Intermediate');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract text from PDF using PDF.js preserving linebreaks and layout
  const handlePdfUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF document (.pdf)');
      return;
    }

    setFile(uploadedFile);
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let extractedFullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Reconstruct layout: insert newlines when y-position changes or item has EOL
        let lastY = null;
        let pageLines = '';
        for (const item of textContent.items) {
          if (!item.str) continue;
          const currentY = item.transform ? Math.round(item.transform[5]) : null;

          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
            pageLines += '\n';
          } else if (item.hasEOL) {
            pageLines += '\n';
          } else if (pageLines.length > 0 && !pageLines.endsWith('\n') && !pageLines.endsWith(' ')) {
            pageLines += ' ';
          }
          pageLines += item.str;
          lastY = currentY;
        }

        extractedFullText += `\n\n--- Page ${pageNum} ---\n\n` + pageLines;
      }

      setRawText(extractedFullText);
      parseQuestionText(extractedFullText);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setErrorMsg('Failed to extract text from this PDF directly. You can copy the text and paste it into the "Paste Text" tab.');
    } finally {
      setIsLoading(false);
    }
  };

  // Robust Multi-Question Parser
  const parseQuestionText = (text) => {
    if (!text || text.trim().length === 0) {
      setErrorMsg('No text content available to parse.');
      return;
    }

    // 1. Check if input is a JSON array
    try {
      const trimmed = text.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const jsonParsed = JSON.parse(trimmed);
        if (Array.isArray(jsonParsed) && jsonParsed.length > 0 && jsonParsed[0].question) {
          const validated = jsonParsed.map((item, idx) => ({
            id: `temp-${idx}`,
            subject: item.subject || targetSubject,
            difficulty: item.difficulty || defaultDifficulty,
            question: item.question || '',
            passage: item.passage || '',
            options: item.options || [
              { label: 'A', text: item.A || 'Option A' },
              { label: 'B', text: item.B || 'Option B' },
              { label: 'C', text: item.C || 'Option C' },
              { label: 'D', text: item.D || 'Option D' }
            ],
            correctOption: (item.correctOption || item.answer || 'A').toUpperCase().charAt(0),
            hint: item.hint || '',
            explanation: item.explanation || 'Official step-by-step solution provided by PrepCBT.'
          }));
          setParsedQuestions(validated);
          initSelection(validated);
          setSuccessMsg(`Successfully parsed ${validated.length} questions from JSON!`);
          return;
        }
      }
    } catch {
      // Not JSON, continue to text parser
    }

    // 2. Clean & Normalize Text
    let cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/---\s*Page\s*\d+\s*---/gi, '\n');

    // 3. Check for standalone Answer Key block at end of document (e.g. 1. A 2. B 3. C)
    const answerKeyMap = {};
    const answerSectionMatch = cleanText.match(/\n\s*(?:ANSWERS?|ANSWER\s+KEY|SOLUTIONS?)\s*[:\n]\s*((?:\d{1,3}\s*[-.:)]\s*[A-D]\s*)+)$/i);
    if (answerSectionMatch) {
      const ansText = answerSectionMatch[1];
      const pairRegex = /(\d{1,3})\s*[-.:)]\s*([A-D])\b/gi;
      let pm;
      while ((pm = pairRegex.exec(ansText)) !== null) {
        answerKeyMap[parseInt(pm[1], 10)] = pm[2].toUpperCase();
      }
    }

    // 4. Multi-pattern question boundary detector:
    // Matches: '1. ', '2) ', '3: ', 'Q1. ', 'Question 1: ', '[1] ', '(1) '
    // Works across lines or inline spaces in PDF text
    const questionRegex = /(?:^|\n|\r|\s{2,}|(?<=[a-zA-Z0-9\.\)\]\:\?]))\s*(?:(?:Q(?:uestion)?\.?\s*)|(?:\b))(\d{1,3})[.)\]:]\s+(?=[A-Za-z0-9\"\'\[\(#\$\_\-\*])/g;

    let matches = [];
    let m;
    while ((m = questionRegex.exec(cleanText)) !== null) {
      matches.push({
        index: m.index,
        matchLen: m[0].length,
        qNum: parseInt(m[1], 10)
      });
    }

    // Fallback strategy: If 0 or 1 match found, try splitting by double newlines with options A/B
    if (matches.length <= 1) {
      const blocks = cleanText.split(/\n\s*\n+/);
      if (blocks.length > 1) {
        const altMatches = [];
        let runningIndex = 0;
        blocks.forEach((b, bIdx) => {
          if (b.search(/(?:^|\s)(?:\([A-D]\)|\[[A-D]\]|[A-D][.)])\s+/i) !== -1) {
            altMatches.push({
              index: cleanText.indexOf(b, runningIndex),
              matchLen: 0,
              qNum: bIdx + 1
            });
            runningIndex = cleanText.indexOf(b, runningIndex) + b.length;
          }
        });
        if (altMatches.length > matches.length) {
          matches = altMatches;
        }
      }
    }

    const questionsList = [];
    let currentPassage = '';

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const nxt = matches[i + 1];
      const startPos = cur.index + cur.matchLen;
      const endPos = nxt ? nxt.index : cleanText.length;
      const chunk = cleanText.slice(startPos, endPos).trim();

      if (!chunk) continue;

      // Check for reading passage
      const passageMatch = chunk.match(/(?:Passage|Comprehension)[:\s]+([\s\S]*?)(?=(?:Q\d|\d+[.)]|\([A-D]\)|[A-D][.)]))/i);
      if (passageMatch) {
        currentPassage = passageMatch[1].trim();
      }

      // Extract Answer Key
      const ansMatch = chunk.match(/(?:Ans(?:wer)?|Key|Correct)[:\s\-=]+([A-D])\b/i);
      let correctOption = 'A';
      if (ansMatch) {
        correctOption = ansMatch[1].toUpperCase();
      } else if (answerKeyMap[cur.qNum]) {
        correctOption = answerKeyMap[cur.qNum];
      }

      // Extract Hint
      const hintMatch = chunk.match(/(?:Hint)[:\s]+([^\n\r]+)/i);
      const hint = hintMatch ? hintMatch[1].trim() : '';

      // Extract Explanation
      const expMatch = chunk.match(/(?:Explanation|Solution)[:\s]+([\s\S]*?)(?=(?:\n\s*\n|$))/i);
      const explanation = expMatch ? expMatch[1].trim() : 'Official step-by-step solution provided by PrepCBT.';

      // Strip answer, hint, and explanation annotations to isolate question stem + options
      let body = chunk
        .replace(/(?:Ans(?:wer)?|Key|Correct)[:\s\-=]+[A-D]\b[^\n]*/gi, '')
        .replace(/(?:Hint)[:\s]+[^\n]*/gi, '')
        .replace(/(?:Explanation|Solution)[:\s]+[\s\S]*/gi, '')
        .trim();

      if (passageMatch) {
        body = body.replace(/(?:Passage|Comprehension)[:\s]+[\s\S]*?$/i, '').trim();
      }

      // Extract Options A, B, C, D (handles A., (A), [A], A), etc.)
      const optRegex = /(?:^|\s|\n)(?:\(([A-D])\)|\[([A-D])\]|([A-D])[.)])\s+/gi;
      const optMatches = [];
      let om;
      while ((om = optRegex.exec(body)) !== null) {
        const letter = (om[1] || om[2] || om[3]).toUpperCase();
        optMatches.push({ index: om.index, len: om[0].length, letter });
      }

      let questionStem = body;
      const options = [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' }
      ];

      if (optMatches.length > 0) {
        questionStem = body.slice(0, optMatches[0].index).trim();
        for (let j = 0; j < optMatches.length; j++) {
          const cOpt = optMatches[j];
          const nOpt = optMatches[j + 1];
          const optText = body.slice(cOpt.index + cOpt.len, nOpt ? nOpt.index : body.length).trim();
          const target = options.find(o => o.label === cOpt.letter);
          if (target) {
            target.text = optText.replace(/\s+/g, ' ');
          }
        }
      }

      // Clean leading question numbers if any remained in stem
      questionStem = questionStem.replace(/^(?:Q(?:uestion)?\s*)?\d+[.)\]:]\s*/i, '').trim();

      if (questionStem && (options[0].text || options[1].text)) {
        // Fallback placeholder text if an option was empty
        options.forEach(o => {
          if (!o.text) o.text = `Option ${o.label}`;
        });

        questionsList.push({
          id: `imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          subject: targetSubject,
          difficulty: defaultDifficulty,
          passage: currentPassage,
          question: questionStem.replace(/\s+/g, ' '),
          options,
          correctOption,
          hint,
          explanation
        });
      }
    }

    if (questionsList.length === 0) {
      setErrorMsg('Could not detect any structured questions. Make sure questions contain numbers (e.g. 1., 2.) followed by options (A, B, C, D).');
      setParsedQuestions([]);
    } else {
      setParsedQuestions(questionsList);
      initSelection(questionsList);
      setErrorMsg('');
      setSuccessMsg(`Successfully parsed ${questionsList.length} questions! All questions are ready for review and import.`);
    }
  };

  const initSelection = (list) => {
    const sel = {};
    list.forEach((_, idx) => { sel[idx] = true; });
    setSelectedQuestions(sel);
  };

  const toggleSelectAll = (checked) => {
    const sel = {};
    parsedQuestions.forEach((_, idx) => { sel[idx] = checked; });
    setSelectedQuestions(sel);
  };

  const toggleSelectOne = (idx) => {
    setSelectedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const applySubjectToAll = () => {
    setParsedQuestions(prev => prev.map(q => ({ ...q, subject: targetSubject })));
    setSuccessMsg(`Updated all ${parsedQuestions.length} questions to ${SUBJECTS.find(s => s.id === targetSubject)?.name || targetSubject}.`);
  };

  const applyDifficultyToAll = () => {
    setParsedQuestions(prev => prev.map(q => ({ ...q, difficulty: defaultDifficulty })));
    setSuccessMsg(`Updated all ${parsedQuestions.length} questions to ${defaultDifficulty} difficulty.`);
  };

  const handleUpdateQuestion = (idx, field, value) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx, optLabel, text) => {
    setParsedQuestions(prev => {
      const updated = [...prev];
      const q = updated[qIdx];
      const newOpts = q.options.map(opt => opt.label === optLabel ? { ...opt, text } : opt);
      updated[qIdx] = { ...q, options: newOpts };
      return updated;
    });
  };

  const handleDeleteParsed = (idx) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCommitImport = () => {
    const toImport = parsedQuestions.filter((_, idx) => !!selectedQuestions[idx]);
    if (toImport.length === 0) {
      setErrorMsg('Please select at least one question to import.');
      return;
    }

    const count = bulkAddQuestions(toImport);
    onImportComplete(count);
  };

  const loadSampleData = () => {
    setRawText(SAMPLE_TEXT_FORMAT);
    parseQuestionText(SAMPLE_TEXT_FORMAT);
    setActiveTab('text');
  };

  const selectedCount = Object.values(selectedQuestions).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Upload Modes Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Bulk Question Ingestion
              </span>
              <span className="text-xs text-emerald-400 font-semibold">• Multi-Question Extraction</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Import Questions from PDF or Formatted Text
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Extracts all questions, options A–D, answer keys, passages, and explanations into your dynamic Question Bank.
            </p>
          </div>

          <button
            onClick={loadSampleData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-sky-400 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Sparkles size={15} />
            <span>Load 5 Sample Questions</span>
          </button>
        </div>

        {/* Global Settings & Batch Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Default Target Subject
              </label>
              {parsedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={applySubjectToAll}
                  className="text-[11px] text-sky-400 hover:underline font-semibold"
                >
                  Apply to all ({parsedQuestions.length})
                </button>
              )}
            </div>
            <select
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
            >
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Default Difficulty Level
              </label>
              {parsedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={applyDifficultyToAll}
                  className="text-[11px] text-sky-400 hover:underline font-semibold"
                >
                  Apply to all ({parsedQuestions.length})
                </button>
              )}
            </div>
            <select
              value={defaultDifficulty}
              onChange={(e) => setDefaultDifficulty(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'pdf'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileUp size={16} />
            <span>Upload PDF Document</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'text'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={16} />
            <span>Paste Text or JSON</span>
          </button>
        </div>

        {/* Tab 1: PDF Upload Dropzone */}
        {activeTab === 'pdf' && (
          <div className="pt-6">
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-8 text-center transition bg-slate-950/40">
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer space-y-3 block">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <FileUp size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {file ? file.name : 'Click to upload or drag & drop past questions PDF'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Extracts multi-page past questions with options A, B, C, D, answers, and explanations.
                  </p>
                </div>
                <div className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/30">
                  Select PDF File
                </div>
              </label>

              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-sky-400 font-semibold animate-pulse">
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Scanning pages, preserving layout, and extracting all questions...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Paste Raw Text / JSON */}
        {activeTab === 'text' && (
          <div className="pt-6 space-y-3">
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste questions here... Numbers (1., 2.), options (A., B., C., D.), and answers are auto-parsed."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Tip: Multiple questions can be separated by numbers (1., 2.) or blank lines.
              </span>
              <button
                onClick={() => parseQuestionText(rawText)}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30"
              >
                <Sparkles size={16} />
                <span>Parse & Extract Questions</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Interactive Review & Edit Table */}
      {parsedQuestions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <span>Extracted Questions ({parsedQuestions.length} Found)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong className="text-white">{selectedCount}</strong> of <strong className="text-white">{parsedQuestions.length}</strong> questions selected for import.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleSelectAll(true)}
                className="text-xs text-sky-400 hover:underline font-semibold"
              >
                Select All ({parsedQuestions.length})
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => toggleSelectAll(false)}
                className="text-xs text-slate-400 hover:underline"
              >
                Deselect All
              </button>

              <button
                onClick={handleCommitImport}
                disabled={selectedCount === 0}
                className="ml-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} />
                <span>Import {selectedCount} Questions to Bank</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {parsedQuestions.map((q, idx) => {
              const isSelected = !!selectedQuestions[idx];
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-950/70 border-slate-700/80 ring-1 ring-sky-500/20'
                      : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(idx)}
                        className="w-4 h-4 rounded text-sky-600 bg-slate-800 border-slate-700 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-sky-400 font-mono">
                        Question #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Subject selector */}
                      <select
                        value={q.subject}
                        onChange={(e) => handleUpdateQuestion(idx, 'subject', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-medium"
                      >
                        {SUBJECTS.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>

                      {/* Difficulty selector */}
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-medium"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>

                      <button
                        onClick={() => setEditingIndex(isEditing ? null : idx)}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Edit Question"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteParsed(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="Remove from import"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="pt-3 space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-slate-400">Question Text</label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <div key={opt.label} className="flex items-center gap-2">
                              <span className="w-5 text-xs font-bold font-mono text-sky-400">{opt.label}.</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleUpdateOption(idx, opt.label, e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Answer Key, Hint & Explanation */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] font-bold uppercase text-slate-400">Correct Key</label>
                            <select
                              value={q.correctOption}
                              onChange={(e) => handleUpdateQuestion(idx, 'correctOption', e.target.value)}
                              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                            >
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase text-slate-400">Hint (Optional)</label>
                            <input
                              type="text"
                              value={q.hint}
                              onChange={(e) => handleUpdateQuestion(idx, 'hint', e.target.value)}
                              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase text-slate-400">Explanation</label>
                            <input
                              type="text"
                              value={q.explanation}
                              onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {q.passage && (
                          <div className="p-2 mb-2 bg-slate-900/60 rounded-lg border border-slate-800 text-xs italic text-slate-300">
                            <span className="font-bold text-sky-400 not-italic mr-1.5">Passage:</span>
                            <MathText text={q.passage} />
                          </div>
                        )}
                        <div className="text-sm text-white font-medium">
                          <MathText text={q.question} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {q.options.map(opt => (
                            <div
                              key={opt.label}
                              className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                                opt.label === q.correctOption
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="font-mono text-sky-400 font-bold">{opt.label}.</span>
                              <span className="truncate">
                                <MathText text={opt.text} />
                              </span>
                              {opt.label === q.correctOption && (
                                <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400">KEY</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="mt-2 text-[11px] text-slate-400">
                            <strong className="text-slate-300 mr-1.5">Explanation:</strong>
                            <MathText text={q.explanation} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commit Button Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Ready to import <strong className="text-white">{selectedCount}</strong> questions into your Question Bank.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitImport}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} />
                <span>Commit & Save {selectedCount} Questions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
