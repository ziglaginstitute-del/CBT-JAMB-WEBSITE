import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function DeleteCandidateModal({ candidate, onConfirm, onCancel }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Delete Candidate Registration</h3>
            <p className="text-xs text-slate-400 mt-0.5">Permanent record removal from CBT database</p>
          </div>
        </div>

        {/* Candidate Detail Card */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Candidate Name:</span>
            <span className="font-extrabold text-white text-sm">{candidate.fullName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registration Number:</span>
            <span className="font-mono font-bold text-sky-400">{candidate.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Registered Email:</span>
            <span className="text-slate-300 font-mono text-[11px]">{candidate.email || 'None on file'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Status:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
              {candidate.status || 'Pending'}
            </span>
          </div>
        </div>

        {/* Warning Note */}
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <span>
            This action cannot be undone. The candidate's login access, allocated docket, and any recorded test results will be permanently erased.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(candidate.id)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Yes, Delete Candidate</span>
          </button>
        </div>

      </div>
    </div>
  );
}
