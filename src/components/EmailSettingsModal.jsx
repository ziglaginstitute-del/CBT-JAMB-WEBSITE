import React, { useState, useEffect } from 'react';
import { 
  Mail, Key, Send, CheckCircle2, AlertTriangle, 
  ExternalLink, Sparkles, Copy, Check, X, ShieldCheck, HelpCircle, Code
} from 'lucide-react';
import { getEmailSettings, saveEmailSettings } from '../utils/storage';
import { sendTestEmail } from '../services/emailService';

export default function EmailSettingsModal({ isOpen, onClose, onSaved }) {
  if (!isOpen) return null;

  const [settings, setSettings] = useState(() => getEmailSettings());
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setSettings(getEmailSettings());
    setTestResult(null);
    setSavedSuccess(false);
  }, [isOpen]);

  const handleSave = (e) => {
    e?.preventDefault();
    saveEmailSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onSaved) onSaved(settings);
  };

  const handleSendTest = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      setTestResult({ success: false, error: 'Please enter a valid email address to receive the test message.' });
      return;
    }

    // Save current settings first so test uses them
    saveEmailSettings(settings);

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail(testEmail.trim(), settings);
      setTestResult({
        success: true,
        message: `✅ Test email successfully delivered to ${testEmail}! Your ${settings.provider.toUpperCase()} email backend is working perfectly.`
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message || 'Failed to dispatch test email. Please check your credentials.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject || "PrepCBT Official Result",
      htmlBody: data.html || data.text,
      body: data.text
    });
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Automated Email Delivery Backend</h2>
              <p className="text-xs text-slate-400">Configure how approved CBT results are dispatched to student inboxes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 overflow-y-auto flex-1 text-xs pr-1">
          
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Email Backend Provider:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, provider: 'resend' }))}
                className={`p-3 rounded-2xl border text-left transition ${
                  settings.provider === 'resend'
                    ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs">Resend API</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Recommended</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  3,000 free emails/mo. 1-minute setup with free API key.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, provider: 'emailjs' }))}
                className={`p-3 rounded-2xl border text-left transition ${
                  settings.provider === 'emailjs'
                    ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="font-extrabold text-white text-xs">EmailJS</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  200 free emails/mo. Connects directly to your Gmail account.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSettings(s => ({ ...s, provider: 'webhook' }))}
                className={`p-3 rounded-2xl border text-left transition ${
                  settings.provider === 'webhook'
                    ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="font-extrabold text-white text-xs">Google Apps Script</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  100% Free with standard Gmail. Zero external accounts needed.
                </p>
              </button>

            </div>
          </div>

          {/* ================= OPTION 1: RESEND ================= */}
          {settings.provider === 'resend' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Key size={14} />
                  <span>Resend Credentials</span>
                </span>
                <a
                  href="https://resend.com/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Get Free Resend Key</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resend API Key: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={settings.resendApiKey || ''}
                  onChange={(e) => setSettings(s => ({ ...s, resendApiKey: e.target.value }))}
                  placeholder="re_123456789abcdef..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Create a free account at <strong>resend.com</strong>, click <em>API Keys</em>, and paste the key here.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender "From" Name & Email:
                </label>
                <input
                  type="text"
                  value={settings.resendFrom || 'PrepCBT <onboarding@resend.dev>'}
                  onChange={(e) => setSettings(s => ({ ...s, resendFrom: e.target.value }))}
                  placeholder="PrepCBT <onboarding@resend.dev>"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default sandbox: <code>PrepCBT &lt;onboarding@resend.dev&gt;</code>. (Or use your verified domain address once added in Resend).
                </p>
              </div>
            </div>
          )}

          {/* ================= OPTION 2: EMAILJS ================= */}
          {settings.provider === 'emailjs' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Key size={14} />
                  <span>EmailJS API Credentials</span>
                </span>
                <a
                  href="https://www.emailjs.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit emailjs.com</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service ID:</label>
                  <input
                    type="text"
                    value={settings.emailjsServiceId || ''}
                    onChange={(e) => setSettings(s => ({ ...s, emailjsServiceId: e.target.value }))}
                    placeholder="e.g. service_xxxxxxx"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Template ID:</label>
                  <input
                    type="text"
                    value={settings.emailjsTemplateId || ''}
                    onChange={(e) => setSettings(s => ({ ...s, emailjsTemplateId: e.target.value }))}
                    placeholder="e.g. template_xxxxxxx"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Public Key:</label>
                <input
                  type="text"
                  value={settings.emailjsPublicKey || ''}
                  onChange={(e) => setSettings(s => ({ ...s, emailjsPublicKey: e.target.value }))}
                  placeholder="e.g. user_xxxxxxxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* ================= OPTION 3: GOOGLE APPS SCRIPT / WEBHOOK ================= */}
          {settings.provider === 'webhook' && (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Code size={14} />
                  <span>Google Apps Script (Send Free from your Gmail)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="text-sky-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedScript ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedScript ? 'Copied Script' : 'Copy Script'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl || ''}
                  onChange={(e) => setSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                <span className="font-bold text-slate-300 block">How to setup in 2 minutes:</span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Go to <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">script.google.com</a> and create a <strong>New Project</strong>.</li>
                  <li>Click <strong>Copy Script</strong> above and paste into the editor.</li>
                  <li>Click <strong>Deploy &rarr; New Deployment</strong>, select <em>Web app</em>, set <strong>Who has access: Anyone</strong>, click Deploy, and copy the Web App URL here!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ================= TEST CONNECTION CARD ================= */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>Verify & Test Email Dispatch</span>
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter your personal email (e.g. you@gmail.com)"
                className="w-full sm:flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting}
                className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isTesting ? 'Sending Test...' : 'Send Test Email'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <div className="leading-relaxed">
                  {testResult.success ? testResult.message : testResult.error}
                </div>
              </div>
            )}
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 size={16} />
              <span>Email delivery settings saved successfully!</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
          >
            <Check size={16} />
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
