import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatDate, formatCurrency, cn } from '../lib/utils';
import { Plus, Search, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Requisition {
  id: string;
  positionId: string;
  positionTitle: string;
  department: string;
  budgetedSalary: number;
  currency: string;
  status: string;
  requestedByName: string;
  approvedByName: string;
  openDate: string;
  closeDate: string;
  notes: string;
}

interface Position {
  id: string;
  title: string;
  status: string;
}

export default function Requisitions() {
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [rData, pData] = await Promise.all([
        api.getRequisitions(),
        api.getPositions(),
      ]);
      setReqs(rData);
      setPositions(pData);
    } catch (e) {
      console.error('Failed to fetch requisitions:', e);
    } finally {
      setLoading(false);
    }
  }

  async function createRequisition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.createRequisition({
        positionId: fd.get('positionId') as string,
        budgetedSalary: parseFloat(fd.get('budgetedSalary') as string) || undefined,
        notes: fd.get('notes') as string,
      });
      setShowModal(false);
      fetchAll();
    } catch (e) {
      console.error('Failed to create requisition:', e);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.updateRequisitionStatus(id, status);
      fetchAll();
    } catch (e) {
      console.error('Failed to update requisition:', e);
    }
  }

  const filtered = reqs.filter(r =>
    r.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openReqs = reqs.filter(r => r.status === 'open');
  const totalBudget = reqs.reduce((sum, r) => sum + (r.budgetedSalary || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Requisitions</h1>
          <p className="text-neutral-500 mt-1">Manage hiring requests and budget approvals.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Requisition
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-swiss">
          <p className="label-swiss">Open Requisitions</p>
          <p className="text-3xl font-bold text-slate-900">{openReqs.length}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Total Budget</p>
          <p className="text-3xl font-bold text-slate-900">{totalBudget > 0 ? formatCurrency(totalBudget) : '$0'}</p>
        </div>
        <div className="card-swiss">
          <p className="label-swiss">Total Requests</p>
          <p className="text-3xl font-bold text-slate-900">{reqs.length}</p>
        </div>
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by position, department, or requester..." 
              className="input-swiss pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="table-swiss">
          <thead>
            <tr>
              <th>Position</th>
              <th>Department</th>
              <th>Budget</th>
              <th>Requested By</th>
              <th>Date</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[10px] font-mono text-slate-400 uppercase">No requisitions found</td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td><p className="text-sm font-bold text-slate-900">{r.positionTitle}</p></td>
                <td><p className="text-xs text-slate-600">{r.department || '—'}</p></td>
                <td><p className="text-xs font-mono text-slate-700">{r.budgetedSalary ? formatCurrency(r.budgetedSalary) : '—'}</p></td>
                <td><p className="text-xs text-slate-600">{r.requestedByName || '—'}</p></td>
                <td><p className="text-[10px] text-slate-500 font-mono">{r.openDate ? formatDate(r.openDate) : '—'}</p></td>
                <td>
                  <span className={cn(
                    "badge-xobiya",
                    r.status === 'open' ? "text-blue-700 bg-blue-100" :
                    r.status === 'closed' ? "text-emerald-700 bg-emerald-100" :
                    "text-slate-500 bg-slate-100"
                  )}>{r.status}</span>
                </td>
                <td className="text-right">
                  {r.status === 'open' && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateStatus(r.id, 'closed')}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, 'cancelled')}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Cancel"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
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
              <h3 className="text-lg font-bold">New Requisition</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createRequisition} className="p-6 space-y-4">
              <div>
                <label className="label-swiss">Position</label>
                <select name="positionId" className="input-swiss" required>
                  <option value="">Select position...</option>
                  {positions.filter(p => p.status === 'vacant').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-swiss">Budgeted Salary</label>
                <input type="number" name="budgetedSalary" step="0.01" className="input-swiss" placeholder="85000.00" />
              </div>
              <div>
                <label className="label-swiss">Notes</label>
                <textarea name="notes" className="input-swiss min-h-[80px]" placeholder="Justification details..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
