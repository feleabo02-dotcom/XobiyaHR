import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AbsenceEntry, AbsenceType, AbsenceStatus, OperationType } from '../types';
import { handleFirestoreError, formatDate, cn } from '../lib/utils';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Absences() {
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchAbsences();
  }, []);

  async function fetchAbsences() {
    try {
      // For MVP we'll show all, in real app we'd filter by workerId if not HR
      const snap = await getDocs(collection(db, 'absences'));
      setAbsences(snap.docs.map(d => ({ id: d.id, ...d.data() } as AbsenceEntry)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'absences');
    } finally {
      setLoading(false);
    }
  }

  async function requestLeave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRequest = {
      workerId: auth.currentUser?.uid,
      type: formData.get('type') as AbsenceType,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      status: AbsenceStatus.PENDING,
      reason: formData.get('reason') as string,
    };

    try {
      await addDoc(collection(db, 'absences'), newRequest);
      setShowRequestModal(false);
      fetchAbsences();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'absences');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Absence Management</h1>
          <p className="text-neutral-500 mt-1">Track leave requests and personnel availability calendars.</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-swiss bg-[#1E293B] text-white border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Allowance Remaining</p>
          <p className="text-4xl font-bold mt-2 font-sans">12.5 <span className="text-sm font-normal opacity-60 uppercase">Days</span></p>
          <div className="mt-4 h-1 bg-white/10 w-full rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-2/3"></div>
          </div>
          <p className="text-[10px] mt-2 font-mono opacity-40">AUTO_CALC: 20 TOTAL / 7.5 USED</p>
        </div>
        <div className="card-swiss">
           <p className="label-swiss">Pending Review</p>
           <p className="text-3xl font-bold mt-1 text-slate-900">{absences.filter(a => a.status === AbsenceStatus.PENDING).length}</p>
           <p className="text-[10px] mt-4 text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1">
             <AlertCircle size={10} /> Requires Manager Audit
           </p>
        </div>
        <div className="card-swiss">
           <p className="label-swiss">Next Holiday</p>
           <p className="text-lg font-bold mt-1 text-slate-900">Mon, May 25</p>
           <p className="text-[10px] mt-4 text-slate-400 font-bold uppercase tracking-widest">Memorial Day (US)</p>
        </div>
      </div>

      <div className="card-swiss overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Personnel Absence Records</h3>
          <div className="flex bg-white rounded border border-slate-200 p-0.5">
             <button className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-900 text-white rounded-sm">All</button>
             <button className="px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">Filter</button>
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Absence Type</th>
              <th>Calendar Period</th>
              <th>Duration</th>
              <th>Sync Status</th>
              <th>Supporting Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Synchronizing...</td>
              </tr>
            ) : absences.length === 0 ? (
              <tr>
                 <td colSpan={5} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No active records</td>
              </tr>
            ) : absences.map((absence) => (
              <tr key={absence.id} className="group">
                <td>
                  <span className="text-xs font-bold text-slate-900 capitalize">{absence.type}</span>
                </td>
                <td>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {formatDate(absence.startDate)} — {formatDate(absence.endDate)}
                  </p>
                </td>
                <td>
                  <p className="text-xs font-medium text-slate-600">3.0 Units</p>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "badge-xobiya",
                      absence.status === AbsenceStatus.APPROVED ? "text-emerald-700 bg-emerald-100" :
                      absence.status === AbsenceStatus.REJECTED ? "text-red-700 bg-red-100" :
                      "text-amber-700 bg-amber-100"
                    )}>
                      {absence.status}
                    </span>
                  </div>
                </td>
                <td className="max-w-xs">
                  <p className="text-[10px] text-slate-400 truncate italic">{absence.reason || 'SYSTEM_DEFAULT_ABSENCE'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg border border-neutral-200"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Request Absence</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={requestLeave} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Leave Type</label>
                <select name="type" className="input-swiss" required>
                  <option value={AbsenceType.VACATION}>Vacation</option>
                  <option value={AbsenceType.SICK}>Sick Leave</option>
                  <option value={AbsenceType.PERSONAL}>Personal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-swiss">Start Date</label>
                  <input type="date" name="startDate" className="input-swiss" required />
                </div>
                <div>
                  <label className="label-swiss">End Date</label>
                  <input type="date" name="endDate" className="input-swiss" required />
                </div>
              </div>
              <div>
                <label className="label-swiss">Reason (Optional)</label>
                <textarea 
                  name="reason" 
                  className="input-swiss min-h-[100px] py-3 text-sm" 
                  placeholder="Supporting details for your request..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">
                  Dismiss
                </button>
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
