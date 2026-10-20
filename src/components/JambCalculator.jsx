import React, { useState } from 'react';
import { X, Delete, Minus, Plus, Divide, X as Multiply, Equal } from 'lucide-react';

export default function JambCalculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const toggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  };

  const squareRoot = () => {
    const val = parseFloat(display);
    if (val < 0) {
      setDisplay('Error');
    } else {
      setDisplay(String(parseFloat(Math.sqrt(val).toFixed(8))));
    }
    setWaitingForOperand(true);
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 'Error' : a / b;
      case '%': return (a * b) / 100;
      default: return b;
    }
  };

  const performOperation = (nextOp) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operation) {
      const current = prevValue || 0;
      const result = calculate(current, inputValue, operation);
      if (result === 'Error') {
        setDisplay('Error');
        setPrevValue(null);
        setOperation(null);
        setWaitingForOperand(true);
        return;
      }
      const formatted = parseFloat(Number(result).toFixed(8));
      setDisplay(String(formatted));
      setPrevValue(formatted);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  const handleEquals = () => {
    if (!operation || prevValue === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(prevValue, inputValue, operation);
    if (result === 'Error') {
      setDisplay('Error');
    } else {
      const formatted = parseFloat(Number(result).toFixed(8));
      setDisplay(String(formatted));
    }
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 rounded-xl bg-slate-900/95 border border-sky-500/30 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-3.5 py-2.5 flex items-center justify-between text-white select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <span className="font-semibold text-xs tracking-wide uppercase font-mono">JAMB Official 8-Digit Calc</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition text-white"
          title="Close Calculator"
        >
          <X size={15} />
        </button>
      </div>

      {/* Screen */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800">
        <div className="text-[10px] text-sky-400/80 font-mono text-right h-4 truncate">
          {prevValue !== null ? `${prevValue} ${operation || ''}` : ''}
        </div>
        <div className="text-2xl font-mono text-white text-right font-bold tracking-wider truncate py-1">
          {display}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="p-3 grid grid-cols-4 gap-1.5 text-sm font-medium select-none bg-slate-900">
        <button onClick={clearAll} className="p-2.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded font-semibold text-xs transition">
          C
        </button>
        <button onClick={clearEntry} className="p-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-xs transition">
          CE
        </button>
        <button onClick={backspace} className="p-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded flex items-center justify-center transition">
          <Delete size={14} />
        </button>
        <button onClick={() => performOperation('÷')} className="p-2.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded font-bold transition flex items-center justify-center">
          <Divide size={15} />
        </button>

        <button onClick={squareRoot} className="p-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-xs font-mono transition">
          √
        </button>
        <button onClick={toggleSign} className="p-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-xs transition">
          ±
        </button>
        <button onClick={() => performOperation('%')} className="p-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-xs transition">
          %
        </button>
        <button onClick={() => performOperation('×')} className="p-2.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded font-bold transition flex items-center justify-center">
          <Multiply size={15} />
        </button>

        <button onClick={() => inputDigit(7)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          7
        </button>
        <button onClick={() => inputDigit(8)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          8
        </button>
        <button onClick={() => inputDigit(9)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          9
        </button>
        <button onClick={() => performOperation('-')} className="p-2.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded font-bold transition flex items-center justify-center">
          <Minus size={15} />
        </button>

        <button onClick={() => inputDigit(4)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          4
        </button>
        <button onClick={() => inputDigit(5)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          5
        </button>
        <button onClick={() => inputDigit(6)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          6
        </button>
        <button onClick={() => performOperation('+')} className="p-2.5 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded font-bold transition flex items-center justify-center">
          <Plus size={15} />
        </button>

        <button onClick={() => inputDigit(1)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          1
        </button>
        <button onClick={() => inputDigit(2)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          2
        </button>
        <button onClick={() => inputDigit(3)} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          3
        </button>
        <button onClick={handleEquals} className="row-span-2 p-2.5 bg-sky-600 text-white hover:bg-sky-500 rounded font-bold transition flex items-center justify-center shadow-lg shadow-sky-600/30">
          <Equal size={18} />
        </button>

        <button onClick={() => inputDigit(0)} className="col-span-2 p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-mono">
          0
        </button>
        <button onClick={inputDecimal} className="p-2.5 bg-slate-800/90 text-white hover:bg-slate-700 rounded transition font-bold font-mono">
          .
        </button>
      </div>
    </div>
  );
}
