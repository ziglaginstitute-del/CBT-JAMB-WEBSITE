import React from 'react';
import { 
  X, Printer, GraduationCap, ShieldCheck, 
  Calendar, Clock, MapPin, User, CheckCircle2, QrCode, BookOpen
} from 'lucide-react';
import { SUBJECTS } from '../data/questions';

export default function CandidateExamSlipModal({ candidate, isOpen, onClose }) {
  if (!isOpen || !candidate) return null;

  const handlePrint = () => {
    window.print();
  };

  const getSubjectName = (id) => {
    return SUBJECTS.find(s => s.id === id)?.name || id;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <ShieldCheck size={16} />
            <span>Official Candidate CBT Examination Docket / Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition shadow-sm"
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Examination Slip Body */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 print:p-6 print:text-black font-sans">
          
          {/* Slip Header with Nigerian Official CBT Look */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 text-center relative">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 text-white flex items-center justify-center shadow-md">
                <GraduationCap size={28} />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
              PrepCBT Mock Examination Portal
            </h1>
            <p className="text-xs uppercase font-bold tracking-widest text-sky-700">
              Standard Computer-Based Test (CBT) Registration Docket
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Accredited Computer-Based Test Center • JAMB UTME & WASSCE Standard Simulation
            </p>

            <div className="absolute right-0 top-0 hidden sm:block text-slate-400">
              <div className="w-16 h-16 border border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center p-1 text-[9px] text-center">
                <QrCode size={30} className="text-slate-700" />
                <span className="font-mono font-bold text-[8px] text-slate-600">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Candidate Profile Details & Passport Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-start pb-6 border-b border-slate-200">
            {/* Passport Photo Box */}
            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div className="w-24 h-28 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 relative overflow-hidden border border-slate-300">
                <User size={48} className="text-slate-400" />
                <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">CANDIDATE</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 mt-1.5 uppercase">
                {candidate.category || 'General'}
              </span>
            </div>

            {/* Profile Info */}
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Full Name</span>
                <p className="text-base font-extrabold text-slate-900">{candidate.fullName}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registration No / Username</span>
                <p className="text-sm font-mono font-black text-sky-700 tracking-wide">{candidate.username}</p>
              </div>

              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
                <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">Exam Passcode / Password</span>
                <p className="text-sm font-mono font-black text-sky-900 tracking-wider">{candidate.password}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Examination</span>
                <p className="font-bold text-slate-800 uppercase">{candidate.examType || 'JAMB UTME'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Center / Examination Hall</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-500 shrink-0" />
                  <span>{candidate.center || 'PrepCBT Center 01 (Main Auditorium)'}</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allocated Seat</span>
                <p className="font-bold text-slate-800 font-mono">{candidate.seatNumber || 'Seat Auto-Assign'}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Exam Status</span>
                <p className="font-bold text-emerald-700 uppercase">{candidate.status || 'Pending'}</p>
              </div>
            </div>
          </div>

          {/* Personalized Registered Subjects Section */}
          <div className="py-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-800 flex items-center gap-1.5">
                <BookOpen size={14} className="text-sky-700" />
                <span>Registered Personalized Examination Subjects ({candidate.registeredSubjects?.length || 0})</span>
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                Only these subjects will appear on your CBT screen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidate.registeredSubjects?.map((subId, idx) => (
                <div 
                  key={subId}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-700 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{getSubjectName(subId)}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 font-semibold text-slate-700">
                    CBT TESTED
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Candidate Instructions */}
          <div className="pt-4 space-y-2 text-[11px] text-slate-600">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 text-xs">Important Exam Guidelines:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Candidates must report with this printed docket and valid student identification.</li>
              <li>Log in to your CBT terminal using your <strong>Registration Number</strong> and confidential <strong>Passcode</strong>.</li>
              <li>Only your assigned {candidate.registeredSubjects?.length || 4} subjects will be presented. The countdown timer runs automatically upon starting.</li>
              <li>Use keyboard shortcuts (<strong>A, B, C, D</strong> to pick options; <strong>N</strong> for next; <strong>P</strong> for previous; <strong>S</strong> to submit).</li>
              <li>Ensure you submit your examination before the scheduled window elapses.</li>
            </ul>
          </div>

          {/* Signatures Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
            <div>
              <div className="h-9 border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Candidate Signature & Date</p>
            </div>
            <div>
              <div className="h-9 border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1 flex items-end justify-center">
                <span className="text-[10px] font-mono font-bold text-sky-800">CBT-ACCREDITED-OFFICER</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Center Supervisor Stamp</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
