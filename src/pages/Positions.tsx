import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  MapPin, 
  Layers, 
  DollarSign, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Position {
  id: string;
  title: string;
  gradeCode: string;
  costCenterId: string;
  department: string;
  location: string;
  fte: number;
  status: string;
  description: string;
}

const POSITION_STATUSES = ['filled', 'vacant', 'frozen'] as const;

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { fetchPositions(); }, []);

  async function fetchPositions() {
    try {
      const data = await api.getPositions();
      setPositions(data);
    } catch (e) {
      console.error('Failed to fetch positions:', e);
    } finally {
      setLoading(false);
    }
  }

  async function createPosition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.createPosition({
        title: formData.get('title') as string,
        gradeCode: formData.get('gradeCode') as string,
        costCenterId: formData.get('costCenterId') as string,
        department: formData.get('department') as string,
        location: formData.get('location') as string,
        fte: parseFloat(formData.get('fte') as string) || 1.0,
        status: formData.get('status') as string,
        description: formData.get('description') as string,
      });
      setShowAddModal(false);
      fetchPositions();
    } catch (e) {
      console.error('Failed to create position:', e);
    }
  }

  const filtered = positions.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.costCenterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const vacantCount = positions.filter(p => p.status === 'vacant').length;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Organizational Structures</h1>
          <p className="text-neutral-500 mt-1">Manage positions, grades, and cost-center allocations.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Position
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SummaryIcon label="Total Positions" value={String(positions.length)} icon={Layers} />
        <SummaryIcon label="Vacant Seats" value={String(vacantCount)} icon={UserCheck} />
        <SummaryIcon label="Filled Ratio" value={positions.length ? `${Math.round(((positions.length - vacantCount) / positions.length) * 100)}%` : '—'} icon={ShieldCheck} />
        <SummaryIcon label="Dept Count" value={String(new Set(positions.map(p => p.department).filter(Boolean)).size)} icon={DollarSign} />
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
             <input 
               type="text" 
               placeholder="Search by position title or cost center..." 
               className="input-swiss pl-10"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        {loading ? (
          <div className="py-20 text-center text-[10px] font-mono text-slate-400 uppercase">Loading positions...</div>
        ) : (
        <table className="table-swiss">
           <thead>
             <tr>
               <th>Job Identity</th>
               <th>Dept & Center</th>
               <th>Grade</th>
               <th>Status</th>
               <th>Location</th>
             </tr>
           </thead>
           <tbody>
             {filtered.length === 0 ? (
               <tr>
                 <td colSpan={5} className="py-20 text-center text-[10px] font-mono text-slate-400 uppercase">No positions found</td>
               </tr>
             ) : filtered.map(p => (
               <tr key={p.id}>
                 <td>
                   <p className="text-sm font-bold">{p.title}</p>
                   <p className="text-[10px] text-neutral-400 font-mono mt-0.5">ID: POS-{p.id.padStart(4, '0')}</p>
                 </td>
                 <td>
                   <p className="text-xs font-medium">{p.department || '—'}</p>
                   <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{p.costCenterId}</p>
                 </td>
                 <td>
                   <span className="text-[10px] font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5">{p.gradeCode || '—'}</span>
                 </td>
                 <td>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-1 border",
                      p.status === 'filled' ? "text-green-600 bg-green-50 border-green-200" :
                      p.status === 'vacant' ? "text-blue-600 bg-blue-50 border-blue-200" :
                      "text-neutral-400 bg-neutral-50 border-neutral-200"
                    )}>
                      {p.status}
                    </span>
                 </td>
                 <td>
                   <p className="text-[10px] text-neutral-500 flex items-center gap-1 uppercase tracking-tight font-bold">
                     <MapPin size={10} /> {p.location || 'Remote'}
                   </p>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl border border-neutral-200 rounded-lg">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Position</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={createPosition} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-swiss">Position Title</label>
                  <input name="title" required className="input-swiss" placeholder="Senior Software Engineer" />
                </div>
                <div>
                  <label className="label-swiss">Grade Code</label>
                  <input name="gradeCode" className="input-swiss" placeholder="L5" />
                </div>
                <div>
                  <label className="label-swiss">Cost Center ID</label>
                  <input name="costCenterId" required className="input-swiss" placeholder="TECH-001" />
                </div>
                <div>
                  <label className="label-swiss">Department</label>
                  <input name="department" className="input-swiss" placeholder="Engineering" />
                </div>
                <div>
                  <label className="label-swiss">Location</label>
                  <input name="location" className="input-swiss" placeholder="London / Remote" />
                </div>
                <div>
                  <label className="label-swiss">FTE</label>
                  <input name="fte" type="number" step="0.1" min="0" max="1" className="input-swiss" placeholder="1.0" />
                </div>
                <div>
                  <label className="label-swiss">Status</label>
                  <select name="status" className="input-swiss">
                    <option value="vacant">Vacant</option>
                    <option value="filled">Filled</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-swiss">Description</label>
                  <textarea name="description" className="input-swiss min-h-[60px]" placeholder="Role description..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Position</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryIcon({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="card-swiss flex items-center gap-4 py-4 hover:border-slate-400 transition-all">
      <div className="p-2 bg-slate-50 text-slate-400 rounded">
        <Icon size={18} />
      </div>
      <div>
        <p className="label-swiss mb-0">{label}</p>
        <p className="text-lg font-bold font-mono tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}
