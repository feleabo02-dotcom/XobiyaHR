import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Worker, Position, AbsenceEntry, WorkerStatus, AbsenceStatus } from '../types';
import { 
  Users, 
  Briefcase, 
  CalendarClock, 
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    openRequisitions: 0,
    pendingAbsences: 0,
    activeProjects: 12, // Mock for now
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const workersSnap = await getDocs(collection(db, 'workers'));
        const absencesSnap = await getDocs(query(collection(db, 'absences')));
        const positionsSnap = await getDocs(collection(db, 'positions'));

        setStats({
          totalWorkers: workersSnap.size,
          pendingAbsences: absencesSnap.docs.filter(d => (d.data() as AbsenceEntry).status === AbsenceStatus.PENDING).length,
          openRequisitions: 5, // Placeholder
          activeProjects: 12,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const departmentData = [
    { name: 'Engineering', count: 45 },
    { name: 'Sales', count: 32 },
    { name: 'Marketing', count: 18 },
    { name: 'HR', count: 12 },
    { name: 'Finance', count: 8 },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-neutral-200" />)}
    </div>
    <div className="h-64 bg-neutral-200" />
  </div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enterprise Dashboard</h1>
          <p className="text-slate-500 mt-1">Global Human Capital metrics with cross-ERP integration status.</p>
        </div>
        <div className="flex bg-white rounded-md border border-slate-200 p-1 shadow-sm shrink-0 self-start">
           <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-white rounded">Real-time</button>
           <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">Historical</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Headcount" 
          value={stats.totalWorkers} 
          icon={Users} 
          trend="+4.2% YoY" 
        />
        <StatCard 
          label="Budgeted Positions" 
          value="1,310" 
          icon={Briefcase} 
          meta="62 Vacant"
        />
        <StatCard 
          label="Pending Payroll" 
          value="$4.21M" 
          icon={CalendarClock} 
          accent="text-blue-600"
          meta="Q3 Period"
          critical={stats.pendingAbsences > 0}
        />
        <StatCard 
          label="Recruitment Velocity" 
          value="18.4" 
          icon={TrendingUp} 
          meta="DAYS AVG"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 card-swiss">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Utilization by Department</h3>
            <div className="flex gap-1">
               <div className="w-3 h-3 bg-blue-600"></div>
               <div className="w-3 h-3 bg-slate-200"></div>
            </div>
          </div>
          <div className="h-80 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '10px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ERP Bridge Status */}
        <div className="card-swiss flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
             <span className="text-blue-500">⇅</span> ERP Sync Bridge
          </h3>
          <div className="space-y-4 flex-1">
            <BridgeItem 
              module="FI" 
              title="Finance: GL Posting" 
              desc="Latest batch synced successfully at 08:42 AM."
              color="bg-emerald-100 text-emerald-600"
            />
            <BridgeItem 
              module="PS" 
              title="PSA: Project Resources" 
              desc="4 Skills updated from Performance Reviews."
              color="bg-purple-100 text-purple-600"
            />
            <BridgeItem 
              module="PR" 
              title="Procurement: IT Assets" 
              desc="3 Laptop requisitions pending vendor approval."
              color="bg-amber-100 text-amber-600"
              warning
            />
          </div>
          <button className="btn-secondary w-full mt-8 text-[10px] uppercase font-bold tracking-widest">
            Integration Diagnostics
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

function BridgeItem({ module, title, desc, color, warning }: { module: string; title: string; desc: string; color: string; warning?: boolean }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-md border transition-all",
      warning ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
    )}>
      <div className={cn("w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0", color)}>
        {module}
      </div>
      <div>
        <p className={cn("text-xs font-bold", warning ? "text-amber-800" : "text-slate-900")}>{title}</p>
        <p className={cn("text-[10px] mt-0.5", warning ? "text-amber-700" : "text-slate-500")}>{desc}</p>
      </div>
    </div>
  );
}
