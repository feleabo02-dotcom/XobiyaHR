import { motion } from 'motion/react';
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Factory,
  HandCoins,
  Headphones,
  Layers3,
  PackageSearch,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';

type ModuleCard = {
  title: string;
  subtitle: string;
  icon: typeof Layers3;
  accent: string;
  functions: string[];
  hrLink: string;
};

type FlowRow = {
  source: string;
  target: string;
  outcome: string;
};

const modules: ModuleCard[] = [
  {
    title: 'Finance & Controlling',
    subtitle: 'Turns payroll, expense, and project cost data into accurate financial control.',
    icon: BadgeDollarSign,
    accent: 'from-emerald-500 to-teal-600',
    functions: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Budgeting & Planning', 'Fixed Assets'],
    hrLink: 'Payroll posting, employee expenses, headcount budgets, and asset custody',
  },
  {
    title: 'Project Management & PSA',
    subtitle: 'Matches qualified people to work, then prices labor in real time.',
    icon: Workflow,
    accent: 'from-blue-500 to-cyan-600',
    functions: ['Resource Staffing', 'Project Costing', 'Revenue Recognition', 'Profitability Analysis'],
    hrLink: 'Skills, certifications, availability, time approvals, and cost rates',
  },
  {
    title: 'Supply Chain & Procurement',
    subtitle: 'Supports onboarding purchases, stock control, and employee-issued assets.',
    icon: Boxes,
    accent: 'from-orange-500 to-amber-600',
    functions: ['Purchase Requisitions', 'Inventory Management', 'Fleet & Logistics'],
    hrLink: 'New-hire provisioning, issued-to employee records, license validation',
  },
  {
    title: 'CRM & Sales',
    subtitle: 'Uses the org chart and employee availability to route customers, service, and revenue tasks.',
    icon: Headphones,
    accent: 'from-fuchsia-500 to-pink-600',
    functions: ['Territory Management', 'Customer Service', 'Quota & Commission'],
    hrLink: 'Org structure, support skills, clock-in status, and compensation records',
  },
  {
    title: 'Manufacturing & Operations',
    subtitle: 'Places certified operators against production orders and absorbs labor costs instantly.',
    icon: Factory,
    accent: 'from-slate-700 to-slate-900',
    functions: ['Shop Floor Control', 'Labor Costing', 'Quality Management', 'Scheduling & Capacity'],
    hrLink: 'Certifications, labor rates, shift availability, and absence data',
  },
];

const flowRows: FlowRow[] = [
  {
    source: 'Payroll cost results',
    target: 'Finance / General Ledger',
    outcome: 'Accurate salary expenses, liabilities, and cost center reporting',
  },
  {
    source: 'Skills, certifications, availability',
    target: 'PSA, CRM, Manufacturing',
    outcome: 'Right person, right task, right time across customer and production work',
  },
  {
    source: 'Approved billable hours',
    target: 'Finance / Accounts Receivable',
    outcome: 'Faster customer invoicing with fewer billing errors',
  },
  {
    source: 'Organizational hierarchy',
    target: 'Finance, CRM, PSA',
    outcome: 'Consistent approvals, territory mapping, and reporting rollups',
  },
  {
    source: 'Onboarding / offboarding status',
    target: 'Finance, IT, Procurement, Operations',
    outcome: 'Automated provisioning and deprovisioning with lower manual effort',
  },
  {
    source: 'Employee as a user/resource',
    target: 'CRM, SCM, Manufacturing',
    outcome: 'Traceable execution across customers, assets, and production orders',
  },
];

const signals = [
  { label: 'Connected modules', value: '5' },
  { label: 'Primary business flows', value: '6' },
  { label: 'People-aware checkpoints', value: '24/7' },
  { label: 'Target outcome', value: 'Integrated ERP control' },
];

export default function Ecosystem() {
  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
      >
        <div className="card-swiss relative overflow-hidden border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_35%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 backdrop-blur">
              <Building2 size={12} /> ERP Ecosystem
            </div>
            <div className="space-y-3 max-w-3xl">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                Non-HR modules that turn worker data into enterprise execution.
              </h1>
              <p className="text-slate-600 text-base leading-7 max-w-2xl">
                This view maps the finance, project, supply chain, CRM, and manufacturing modules that depend on the HR backbone.
                It shows how employee records, skills, availability, and payroll outputs flow into the rest of the business.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {signals.map((signal) => (
                <div key={signal.label} className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{signal.label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-swiss space-y-4">
          <p className="label-swiss">Operational thesis</p>
          <div className="space-y-3 text-sm text-slate-600 leading-6">
            <p>The HR module is the system of record for people, but the enterprise only becomes useful when other modules consume that data in real time.</p>
            <p>Finance needs payroll and cost center mapping. PSA needs skills and availability. CRM needs the org chart. Manufacturing needs certification and shift status. Procurement needs onboarding events.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Value created</p>
            <div className="mt-3 flex items-center gap-3 text-slate-900 font-semibold">
              <ShieldCheck size={18} className="text-emerald-600" />
              Less manual reconciliation
            </div>
            <div className="mt-2 flex items-center gap-3 text-slate-900 font-semibold">
              <PackageSearch size={18} className="text-blue-600" />
              Better asset and purchase control
            </div>
            <div className="mt-2 flex items-center gap-3 text-slate-900 font-semibold">
              <BarChart3 size={18} className="text-amber-600" />
              Faster profit and utilization analysis
            </div>
          </div>
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Connected modules</h2>
            <p className="text-sm text-slate-500 mt-1">Each module consumes people data and produces business data back into the ERP loop.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <motion.article
                key={module.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="card-swiss flex flex-col gap-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${module.accent} text-white shadow-lg shadow-slate-200`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{module.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 leading-6">{module.subtitle}</p>
                  </div>
                </div>

                <div>
                  <p className="label-swiss">Core business functions</p>
                  <div className="flex flex-wrap gap-2">
                    {module.functions.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">HR integration</p>
                  <p className="mt-2 text-sm text-slate-700 leading-6">{module.hrLink}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="card-swiss space-y-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Primary data flows</h2>
          <p className="text-sm text-slate-500 mt-1">This is the bidirectional flow layer that makes the ERP more than a set of isolated apps.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="table-swiss">
            <thead>
              <tr>
                <th>From HR</th>
                <th>To module</th>
                <th>Business outcome</th>
              </tr>
            </thead>
            <tbody>
              {flowRows.map((row) => (
                <tr key={`${row.source}-${row.target}`}>
                  <td className="font-semibold text-slate-900">{row.source}</td>
                  <td className="text-slate-600">{row.target}</td>
                  <td className="text-slate-600 leading-6">{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card-swiss space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Settings2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">What this unlocks</h2>
              <p className="text-sm text-slate-500">A single worker record can drive multiple enterprise decisions.</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 leading-6">
            <li className="flex gap-3"><span className="text-blue-600 font-bold">01</span> Department leaders get consistent approvals and cost rollups.</li>
            <li className="flex gap-3"><span className="text-blue-600 font-bold">02</span> Operations can check certifications before a task starts.</li>
            <li className="flex gap-3"><span className="text-blue-600 font-bold">03</span> Finance can reconcile payroll, labor, and vendor invoices faster.</li>
            <li className="flex gap-3"><span className="text-blue-600 font-bold">04</span> CRM and PSA can route the right people to the right work automatically.</li>
          </ul>
        </div>

        <div className="card-swiss space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Business flow examples</h2>
              <p className="text-sm text-slate-500 mt-1">Typical cross-module scenarios represented in this ERP model.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Live integration map
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <HandCoins size={16} className="text-emerald-600" />
                Finance
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-6">Payroll posts into the GL, expense reports become AP vouchers, and budget checks protect headcount spend.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <BriefcaseBusiness size={16} className="text-blue-600" />
                PSA
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-6">Skills, availability, and approved hours flow into staffing, project costing, and billing.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <PackageSearch size={16} className="text-orange-600" />
                Procurement
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-6">Onboarding workflows can raise requisitions for laptops, licenses, uniforms, and asset assignments.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Users size={16} className="text-fuchsia-600" />
                CRM + Operations
              </div>
              <p className="mt-2 text-sm text-slate-600 leading-6">Territories, support routing, commissions, production authorization, and quality root-cause analysis all rely on worker context.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}