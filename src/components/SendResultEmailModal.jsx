import React, { useState } from 'react';
import { 
  Mail, Check, Copy, ExternalLink, X, Send, Sparkles, 
  AlertCircle, AlertTriangle, Settings, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { generateResultEmailContent, openMailClientForResult, sendResultEmail } from '../services/emailService';
import { getEmailSettings } from '../utils/storage';
import EmailSettingsModal from './EmailSettingsModal';

export default function SendResultEmailModal({ candidate, onClose, onSentSuccess }) {
  if (!candidate) return null;

  const [recipientEmail, setRecipientEmail] = useState(candidate.email || '');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const settings = getEmailSettings();
  const isConfigured = Boolean(
    (settings.provider === 'resend' && settings.resendApiKey) ||
    (settings.provider === 'emailjs' && settings.emailjsServiceId && settings.emailjsPublicKey) ||
    (settings.provider === 'webhook' && settings.webhookUrl)
  );

  const { subject, body, totalMissedCount } = generateResultEmailContent({
    ...candidate,
    email: recipientEmail
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(`SUBJECT: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMailClient = () => {
    openMailClientForResult({
      ...candidate,
      email: recipientEmail
    });
    if (onSentSuccess) {
      onSentSuccess(candidate.id, recipientEmail);
    }
  };

  const handleDirectSend = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }

    if (!isConfigured) {
      setStatusMessage({ 
        type: 'error', 
        text: 'Email backend is not configured yet. Click "Configure Backend" below to connect Resend, EmailJS, or Google Apps Script.' 
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      await sendResultEmail({
        ...candidate,
        email: recipientEmail.trim()
      });

      setStatusMessage({
        type: 'success',
        text: `Official result statement delivered successfully to ${recipientEmail.trim()} via ${settings.provider.toUpperCase()}!`
      });

      if (onSentSuccess) {
        onSentSuccess(candidate.id, recipientEmail.trim());
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Email delivery failed. Please verify your backend credentials.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Send Official Score & Question Breakdown</h3>
                <p className="text-xs text-slate-400">Deliver performance transcript to student's email</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>

          {/* Backend Status Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Backend:</span>
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
              onClick={() => setIsSettingsOpen(true)}
              className="text-sky-400 hover:underline flex items-center gap-1 font-semibold text-xs"
            >
              <Settings size={13} />
              <span>Configure Backend</span>
            </button>
          </div>

          {/* Feedback Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                <span>{statusMessage.text}</span>
                {statusMessage.type === 'error' && !isConfigured && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="block mt-1 font-bold underline hover:text-white"
                  >
                    Click here to configure Email Delivery Backend &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Recipient Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Recipient Student Email Address:
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="e.g. student@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
              {!recipientEmail && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  No email was provided at registration. Enter an email address above to dispatch.
                </span>
              )}
            </div>

            {/* Subject Line */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Subject Line:</span>
              <p className="text-white font-semibold text-xs">{subject}</p>
            </div>

            {/* Report Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Performance Transcript & Question Review Preview:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied Full Report' : 'Copy Report'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={9}
                value={body}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-slate-300 leading-relaxed focus:outline-none resize-none select-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenMailClient}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                title="Open email in your computer's mail application"
              >
                <ExternalLink size={14} />
                <span>Open in Mail App</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSend}
                disabled={isSending}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{isSending ? 'Sending Transcript...' : 'Dispatch Result Email'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {isSettingsOpen && (
        <EmailSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}
