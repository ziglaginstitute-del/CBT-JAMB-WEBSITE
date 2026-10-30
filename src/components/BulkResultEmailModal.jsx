import React, { useState } from 'react';
import { 
  Mail, Send, CheckCircle2, AlertTriangle, 
  X, Check, Settings, RefreshCw, Users, ShieldAlert, Award
} from 'lucide-react';
import { sendResultEmail } from '../services/emailService';
import { getEmailSettings } from '../utils/storage';

export default function BulkResultEmailModal({ 
  candidates, 
  isGlobalReleased, 
  onClose, 
  onOpenSettings,
  onCandidateUpdated 
}) {
  const eligibleCandidates = (candidates || []).filter(c => 
    c.status === 'Completed' && 
    (c.resultsReleased || isGlobalReleased) && 
    c.email && c.email.includes('@')
  );

  const [statuses, setStatuses] = useState({}); // { [candidateId]: { status: 'idle' | 'sending' | 'success' | 'error', message: '' } }
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [overallError, setOverallError] = useState('');

  const settings = getEmailSettings();
  const isConfigured = Boolean(
    (settings.provider === 'resend' && settings.resendApiKey) ||
    (settings.provider === 'emailjs' && settings.emailjsServiceId && settings.emailjsPublicKey) ||
    (settings.provider === 'webhook' && settings.webhookUrl)
  );

  const handleStartBulkDispatch = async () => {
    if (eligibleCandidates.length === 0) return;
    if (!isConfigured) {
      setOverallError('Email provider is not configured. Please click "Configure Email Backend" to enter your API credentials.');
      return;
    }

    setIsProcessing(true);
    setOverallError('');
    let done = 0;

    for (const cand of eligibleCandidates) {
      setStatuses(prev => ({
        ...prev,
        [cand.id]: { status: 'sending', message: 'Sending transcript...' }
      }));

      try {
        await sendResultEmail(cand);
        done++;
        setCompletedCount(done);
        setStatuses(prev => ({
          ...prev,
          [cand.id]: { status: 'success', message: 'Email delivered' }
        }));
        if (onCandidateUpdated) {
          onCandidateUpdated(cand.id);
        }
      } catch (err) {
        setStatuses(prev => ({
          ...prev,
          [cand.id]: { status: 'error', message: err.message || 'Delivery failed' }
        }));
      }

      // 400ms pause between candidates to avoid rate limiting
      await new Promise(r => setTimeout(r, 400));
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Bulk Result Email Dispatcher</h3>
              <p className="text-xs text-slate-400">
                Send approved CBT scores and question reviews to all released candidates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Backend Provider Status */}
        <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Email Backend:</span>
            <span className="font-bold text-sky-400 uppercase font-mono">{settings.provider}</span>
            {isConfigured ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ready
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Not Configured
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="text-sky-400 hover:underline flex items-center gap-1 font-semibold text-xs"
          >
            <Settings size={13} />
            <span>Configure Backend</span>
          </button>
        </div>

        {overallError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{overallError}</span>
          </div>
        )}

        {/* Candidate List */}
        <div className="space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold px-1">
            <span>Eligible Released Candidates ({eligibleCandidates.length})</span>
            {isProcessing && (
              <span className="text-sky-400 font-mono">
                Dispatched {completedCount} / {eligibleCandidates.length}
              </span>
            )}
          </div>

          {eligibleCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <Users size={32} className="mx-auto text-slate-600" />
              <p className="font-bold text-slate-400">No released candidates with registered email addresses found</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Make sure candidates have completed exams, results are toggled to "Released", and valid emails were entered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleCandidates.map((c) => {
                const s = statuses[c.id] || { status: 'idle', message: 'Ready in queue' };
                return (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{c.fullName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-sky-400">{c.username}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">{c.email}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{c.examResult?.totalScore || 0}/400</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {s.status === 'idle' && (
                        <span className="text-slate-500 text-[11px] font-medium">Pending</span>
                      )}
                      {s.status === 'sending' && (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold animate-pulse flex items-center gap-1">
                          <RefreshCw size={11} className="animate-spin" />
                          <span>Sending...</span>
                        </span>
                      )}
                      {s.status === 'success' && (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Check size={12} />
                          <span>Delivered</span>
                        </span>
                      )}
                      {s.status === 'error' && (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold" title={s.message}>
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleStartBulkDispatch}
            disabled={isProcessing || eligibleCandidates.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>
              {isProcessing
                ? `Dispatching Emails (${completedCount}/${eligibleCandidates.length})...`
                : `Dispatch to All ${eligibleCandidates.length} Candidates`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
