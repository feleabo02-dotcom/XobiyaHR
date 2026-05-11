import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { formatDate, cn } from '../lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus,
  CheckSquare,
  Square,
  UserX,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  workerType: string;
  hireDate: string;
  status: string;
  department: string;
  jobTitle: string;
  photoUrl?: string;
}

const WORKER_TYPES = ['employee', 'contractor', 'intern', 'contingent'] as const;
const WORKER_STATUSES = ['active', 'onboarding', 'offboarding', 'terminated'] as const;

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { fetchWorkers(); }, []);

  async function fetchWorkers() {
    try {
      const data = await api.getWorkers();
      setWorkers(data);
      setSelectedWorkers(new Set());
    } catch (e) {
      console.error('Failed to fetch workers:', e);
    } finally {
      setLoading(false);
    }
  }

  async function addWorker(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newWorker = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      workerType: formData.get('workerType') as string,
      status: 'active',
      department: formData.get('department') as string,
      jobTitle: formData.get('jobTitle') as string,
      hireDate: formData.get('hireDate') as string,
    };

    try {
      await api.createWorker(newWorker);
      setShowAddModal(false);
      fetchWorkers();
    } catch (e) {
      console.error('Failed to create worker:', e);
    }
  }

  const toggleSelectAll = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map(w => w.id)));
    }
  };

  const toggleSelectWorker = (id: string) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedWorkers(newSelected);
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setIsProcessing(true);
    try {
      for (const id of selectedWorkers) {
        await api.updateWorker(id, { status } as any);
      }
      await fetchWorkers();
    } catch (e) {
      console.error('Bulk update failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    `${w.firstName} ${w.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.jobTitle && w.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Worker Directory</h1>
          <p className="text-slate-500 mt-1">Manage global workforce identities and lifecycle status.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          <span>Provision Worker</span>
        </button>
      </div>

      <AnimatePresence>
        {selectedWorkers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card-swiss bg-blue-50 border-blue-200 py-3 px-4 flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                {selectedWorkers.size}
              </div>
              <span className="text-sm font-bold text-blue-900">Workers Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded border border-blue-200 p-0.5">
                {['active', 'onboarding', 'offboarding'].map(s => (
                  <button
                    key={s}
                    disabled={isProcessing}
                    onClick={() => handleBulkUpdateStatus(s)}
                    className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setSelectedWorkers(new Set())}
                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Plus className="rotate-45" size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card-swiss overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email, or role..." 
              className="input-swiss pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-swiss">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                    {selectedWorkers.size === filteredWorkers.length && filteredWorkers.length > 0 
                      ? <CheckSquare size={18} className="text-blue-600" /> 
                      : <Square size={18} />
                    }
                  </button>
                </th>
                <th>Worker Identity</th>
                <th>Role & Department</th>
                <th>Journey Stage</th>
                <th>Target Date</th>
                <th className="text-right px-8">Sync Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-mono text-[10px] uppercase tracking-widest bg-white">
                    Loading Personnel Records...
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-mono text-[10px] uppercase tracking-widest bg-white">
                    No matching records found
                  </td>
                </tr>
              ) : filteredWorkers.map((worker) => (
                <tr key={worker.id} className={cn("group transition-colors", selectedWorkers.has(worker.id) && "bg-blue-50/30")}>
                  <td className="text-center">
                    <button 
                      onClick={() => toggleSelectWorker(worker.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedWorkers.has(worker.id) 
                        ? <CheckSquare size={18} className="text-blue-600" /> 
                        : <Square size={18} />
                      }
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-500 font-bold text-xs">
                        {worker.firstName[0]}{worker.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{worker.firstName} {worker.lastName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium">{worker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-semibold text-slate-700">{worker.jobTitle || '—'}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{worker.department || 'Unassigned'}</p>
                  </td>
                  <td>
                    <span className={cn(
                      "badge-xobiya",
                      worker.status === 'active' ? "text-emerald-700 bg-emerald-100" :
                      worker.status === 'onboarding' ? "text-blue-700 bg-blue-100" :
                      worker.status === 'offboarding' ? "text-amber-700 bg-amber-100" :
                      "text-slate-700 bg-slate-100"
                    )}>
                      {worker.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {worker.hireDate ? formatDate(worker.hireDate) : '—'}
                    </p>
                  </td>
                  <td className="text-right px-8">
                    <div className="flex items-center justify-end gap-2">
                       <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-tighter">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Synced
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Showing {filteredWorkers.length} workers / Total: {workers.length}
          </p>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl border border-slate-200 shadow-2xl rounded-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Provision New Worker Identity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={addWorker} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-swiss">First Name</label>
                  <input name="firstName" required className="input-swiss" placeholder="John" />
                </div>
                <div>
                  <label className="label-swiss">Last Name</label>
                  <input name="lastName" required className="input-swiss" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="label-swiss">Corporate Email</label>
                  <input name="email" type="email" required className="input-swiss" placeholder="j.doe@nexus.inc" />
                </div>
                <div>
                  <label className="label-swiss">Worker Type</label>
                  <select name="workerType" className="input-swiss">
                    <option value="employee">Full-time Employee</option>
                    <option value="contractor">Contractor</option>
                    <option value="intern">Intern</option>
                    <option value="contingent">Contingent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-swiss">Department</label>
                  <input name="department" className="input-swiss" placeholder="Engineering" />
                </div>
                <div>
                  <label className="label-swiss">Job Title</label>
                  <input name="jobTitle" className="input-swiss" placeholder="Software Architect" />
                </div>
              </div>
              <div>
                <label className="label-swiss">Hire Date</label>
                <input name="hireDate" type="date" className="input-swiss" />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Finalize Provisioning
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
