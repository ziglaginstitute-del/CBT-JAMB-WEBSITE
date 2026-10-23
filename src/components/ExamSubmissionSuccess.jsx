import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, Mail, Lock, User, LogOut, FileText } from 'lucide-react';

export default function ExamSubmissionSuccess({ examConfig, candidateEmail, onExitToLogin }) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-3xl mx-auto">
      <div className="w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Verified Shield */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck size={36} className="stroke-[2.2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={13} />
            <span>Official CBT Examination Session Sealed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Examination Successfully Submitted
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Your responses have been securely encrypted and logged on the examination server.
          </p>
        </div>

        {/* Candidate & Docket Verification Receipt */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Candidate Verification Receipt</span>
            <span className="text-emerald-400 font-mono font-bold">RECEIPT REF: CBT-{Date.now().toString().slice(-6)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">Candidate Full Name</span>
              <span className="font-extrabold text-white text-sm mt-0.5 block">{examConfig.candidateName || 'Candidate'}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">Registration Number</span>
              <span className="font-mono font-extrabold text-sky-400 text-sm mt-0.5 block">{examConfig.candidateReg || 'CBT/2026/000'}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">Target Examination</span>
              <span className="font-bold text-slate-200 mt-0.5 block uppercase">{examConfig.examType || 'JAMB UTME'}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block">Time of Submission</span>
              <span className="font-mono font-bold text-slate-300 mt-0.5 block">{formattedDate} • {formattedTime}</span>
            </div>

            <div className="sm:col-span-2 p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sky-400 font-medium">
                <Mail size={16} className="shrink-0" />
                <span className="text-[11px] sm:text-xs text-slate-300">
                  Registered Result Email: <strong className="text-white font-mono">{candidateEmail || examConfig.candidateEmail || 'Registered Email'}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
                Delivery Target
              </span>
            </div>
          </div>
        </div>

        {/* Official Withheld Policy Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Lock size={15} />
            <span>Anti-Malpractice Protocol: Immediate Score Withholding</span>
          </div>
          <p className="text-[11px] text-amber-200/80">
            In accordance with accreditation standards, immediate raw scores and answer keys are locked at the candidate terminal to ensure test integrity and permit central administrative compilation.
          </p>
          <p className="text-[11px] text-amber-200/80">
            Once scores have been reviewed and approved by the center examination officer:
          </p>
          <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-300/90 font-medium">
            <li>Your official score and performance transcript will be emailed directly to <strong>{candidateEmail || 'your email'}</strong>.</li>
            <li>You will be able to log back into this portal with your Registration Number to review every question and explanation.</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onExitToLogin}
            className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-sky-600/30 transition flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut size={16} />
            <span>Exit Terminal & Return to Login Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
}
