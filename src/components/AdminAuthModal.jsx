import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { verifyAdminPassword, ADMIN_SESSION_STORAGE_KEY } from '../data/defaultSettings';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setErrorMessage('');
      setShowPassword(false);
      setIsShaking(false);
      // Autofocus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      triggerError('Please enter the administrator passcode.');
      return;
    }

    const isValid = verifyAdminPassword(passcode);
    if (isValid) {
      // Store in session storage
      try {
        sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('Unable to persist admin session to sessionStorage', err);
      }

      setErrorMessage('');
      onSuccess?.();
      onClose?.();
    } else {
      triggerError('Invalid Master Administrator Passcode. Access denied.');
    }
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 450);
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isShaking ? 'animate-shake border-rose-500/80 ring-2 ring-rose-500/30' : ''
        }`}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Lock size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">Staff & Admin Gate</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Secured
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Examination Control Access</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-xs text-slate-300 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <ShieldAlert size={14} />
              <span>Restricted Administrative Zone</span>
            </div>
            This section is exclusively for accredited school exam officers. Enter your master administrator password to unlock the Question Bank, Candidate Manager, Mocks Scheduler, and Gradebook.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 tracking-wide">
              Master Admin Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound size={16} />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter master password..."
                className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/90 border rounded-xl text-white text-sm focus:outline-none transition font-mono ${
                  errorMessage 
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400' 
                    : 'border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errorMessage ? (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 font-medium animate-pulse">
                <AlertCircle size={13} />
                <span>{errorMessage}</span>
              </p>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>Default setup passcode: <code className="text-amber-400/90 font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">admin2026</code></span>
                <span className="text-slate-400">Ctrl+Shift+A</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <ShieldCheck size={16} className="stroke-[2.5]" />
              <span>Unlock Admin Portal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
