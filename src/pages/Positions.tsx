import React from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Layers, 
  DollarSign, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { PositionStatus } from '../types';
import { cn } from '../lib/utils';

export default function Positions() {
  const positions = [
    { title: 'Senior Software Engineer', dept: 'Engineering', status: PositionStatus.FILLED, grade: 'L5', costCenter: 'TECH-001', location: 'London' },
    { title: 'Product Manager', dept: 'Growth', status: PositionStatus.VACANT, grade: 'L4', costCenter: 'PROD-002', location: 'New York' },
    { title: 'Head of People', dept: 'HR', status: PositionStatus.FILLED, grade: 'E1', costCenter: 'CORP-010', location: 'London' },
    { title: 'Solutions Architect', dept: 'Sales', status: PositionStatus.FROZEN, grade: 'L6', costCenter: 'SALES-044', location: 'Remote' },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Organizational Structures</h1>
          <p className="text-neutral-500 mt-1">Manage positions, grades, and cost-center allocations.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Position
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SummaryIcon label="Total Positions" value="142" icon={Layers} />
        <SummaryIcon label="Vacant Seats" value="8" icon={UserCheck} />
        <SummaryIcon label="FTE Utilization" value="98.2%" icon={ShieldCheck} />
        <SummaryIcon label="Budget Ceiling" value="$14.2M" icon={DollarSign} />
      </div>

      <div className="card-swiss">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
             <input type="text" placeholder="Search by position title or cost center..." className="input-swiss pl-10" />
          </div>
        </div>
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
             {positions.map((p, i) => (
               <tr key={i}>
                 <td>
                   <p className="text-sm font-bold">{p.title}</p>
                   <p className="text-[10px] text-neutral-400 font-mono mt-0.5">ID: POS-{(i+1).toString().padStart(4, '0')}</p>
                 </td>
                 <td>
                   <p className="text-xs font-medium">{p.dept}</p>
                   <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{p.costCenter}</p>
                 </td>
                 <td>
                   <span className="text-[10px] font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5">{p.grade}</span>
                 </td>
                 <td>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-1 border",
                      p.status === PositionStatus.FILLED ? "text-green-600 bg-green-50 border-green-200" :
                      p.status === PositionStatus.VACANT ? "text-blue-600 bg-blue-50 border-blue-200" :
                      "text-neutral-400 bg-neutral-50 border-neutral-200"
                    )}>
                      {p.status}
                    </span>
                 </td>
                 <td>
                   <p className="text-[10px] text-neutral-500 flex items-center gap-1 uppercase tracking-tight font-bold">
                     <MapPin size={10} /> {p.location}
                   </p>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
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
