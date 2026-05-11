import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { Plus, Search, UserPlus, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface Assignment {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  positionId: string;
  positionTitle: string;
  department: string;
  startDate: string;
  endDate?: string;
  managerId?: string;
  isPrimary: boolean;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Position {
  id: string;
  title: string;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [aData, wData, pData] = await Promise.all([
        api.getAssignments(),
        api.getWorkers(),
        api.getPositions(),
      ]);
      setAssignments(aData);
      setWorkers(wData);
      setPositions(pData);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function createAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.createAssignment({
        workerId: fd.get('workerId') as string,
        positionId: fd.get('positionId') as string,
        startDate: fd.get('startDate') as string,
      });
      setShowModal(false);
      fetchAll();
    } catch (e) {
      console.error('Failed to create assignment:', e);
    }
  }

  const filtered = assignments.filter(a =>
    a.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAssignments = assignments.filter(a => !a.endDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Assignments</h1>
          <p className="text-neutral-500 mt-1">Map workers to positions and manage reporting lines.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-swiss">
          <p className="label-swiss">Active Assignments</p>
          <p className="text-3xl font-bold text-slate-900">{activeAssignments.length}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Total Workers</p>
          <p className="text-3xl font-bold text-slate-900">{workers.length}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Total Positions</p>
          <p className="text-3xl font-bold text-slate-900">{positions.length}</p>
        </div>
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by worker, position, or department..." 
              className="input-swiss pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Position</th>
              <th>Department</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No assignments found</td>
              </tr>
            ) : filtered.map(a => (
              <tr key={a.id}>
                <td>
                  <p className="text-sm font-bold text-slate-900">{a.workerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{a.workerEmail}</p>
                </td>
                <td>
                  <p className="text-xs font-semibold text-slate-700">{a.positionTitle}</p>
                </td>
                <td>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{a.department || '—'}</p>
                </td>
                <td>
                  <p className="text-[10px] text-slate-500 font-mono">{formatDate(a.startDate)}</p>
                </td>
                <td>
                  <p className="text-[10px] text-slate-500 font-mono">{a.endDate ? formatDate(a.endDate) : '—'}</p>
                </td>
                <td>
                  <span className={cn(
                    "badge-xobiya",
                    a.endDate ? "text-slate-500 bg-slate-100" : "text-emerald-700 bg-emerald-100"
                  )}>
                    {a.endDate ? 'Ended' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createAssignment} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Worker</label>
                <select name="workerId" className="input-swiss" required>
                  <option value="">Select worker...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Position</label>
                <select name="positionId" className="input-swiss" required>
                  <option value="">Select position...</option>
                  {positions.filter(p => p.status !== 'frozen').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Start Date</label>
                <input type="date" name="startDate" className="input-swiss" required />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
