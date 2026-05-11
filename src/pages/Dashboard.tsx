import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { 
  Users, 
  Briefcase, 
  CalendarClock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

import { cn, formatDate } from '../lib/utils';

interface DashboardStats {
  totalWorkers: number;
  activeWorkers: number;
  vacantPositions: number;
  totalPositions: number;
  pendingAbsences: number;
  openRequisitions: number;
  totalAssignments: number;
  departmentDistribution: { name: string; count: number }[];
  recentPendingAbsences: { id: string; workerName: string; type: string; startDate: string; endDate: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-neutral-200 rounded" />)}
    </div>
    <div className="h-64 bg-neutral-200 rounded" />
  </div>;

  if (!stats) return <div className="text-center py-20 text-slate-400">Failed to load dashboard</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enterprise Dashboard</h1>
          <p className="text-slate-500 mt-1">Global Human Capital metrics with ERP integration status.</p>
        </div>
        <div className="flex bg-white rounded-md border border-slate-200 p-1 shadow-sm shrink-0 self-start">
           <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white rounded">Real-time</button>
           <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">Historical</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Headcount" value={stats.totalWorkers} icon={Users} trend={`${stats.activeWorkers} Active`} />
        <StatCard label="Total Positions" value={stats.totalPositions} icon={Briefcase} meta={`${stats.vacantPositions} Vacant`} />
        <StatCard label="Pending Absences" value={stats.pendingAbsences} icon={CalendarClock} accent="text-amber-600" critical={stats.pendingAbsences > 0} />
        <StatCard label="Open Requisitions" value={stats.openRequisitions} icon={TrendingUp} meta={stats.totalAssignments > 0 ? `${stats.totalAssignments} Assignments` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-swiss">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Headcount by Department</h3>
            <div className="flex gap-1">
               <div className="w-3 h-3 bg-blue-600"></div>
               <div className="w-3 h-3 bg-slate-200"></div>
            </div>
          </div>
          <div className="h-80 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentDistribution.length > 0 ? stats.departmentDistribution : [{ name: 'No Data', count: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '10px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-swiss flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
             <span className="text-blue-500">⇅</span> Pending Absences
          </h3>
          <div className="space-y-4 flex-1">
            {stats.recentPendingAbsences.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-mono text-center py-8">No pending requests</p>
            ) : stats.recentPendingAbsences.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-100">
                <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 bg-amber-100 text-amber-600">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800">{a.workerName}</p>
                  <p className="text-[10px] text-amber-700 capitalize">{a.type} &middot; {formatDate(a.startDate)}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary w-full mt-8 text-[10px] uppercase font-bold tracking-widest">
            View All Requests
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, meta, critical, accent }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  trend?: string; 
  meta?: string;
  critical?: boolean; 
  accent?: string;
}) {
  return (
    <div className="card-swiss group hover:border-slate-400 transition-all flex flex-col justify-between">
      <div>
         <p className="label-swiss text-slate-500">{label}</p>
         <div className="flex items-baseline gap-2 mt-1">
            <span className={cn("text-3xl font-bold tracking-tight text-slate-900 font-sans", accent)}>{value}</span>
            {trend && <span className="text-xs text-emerald-600 font-bold">{trend}</span>}
            {meta && <span className="text-xs text-slate-400 font-bold uppercase">{meta}</span>}
         </div>
      </div>
      
      {critical ? (
        <div className="flex items-center gap-2 mt-4 px-2 py-1 bg-amber-50 rounded">
           <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
           <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Action Required</span>
        </div>
      ) : (
        <div className="w-full bg-slate-100 h-1 rounded-full mt-6 overflow-hidden">
           <div className="bg-blue-600 h-full w-[84%]"></div>
        </div>
      )}
    </div>
  );
}
