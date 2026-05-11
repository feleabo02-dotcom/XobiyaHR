import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { 
  Users, 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  Target,
  Search,
  Clock,
  FileText,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

import Dashboard from './pages/Dashboard';
import Ecosystem from './pages/Ecosystem';
import Workers from './pages/Workers';
import Positions from './pages/Positions';
import Absences from './pages/Absences';
import Assignments from './pages/Assignments';
import Requisitions from './pages/Requisitions';
import LoginPage from './pages/LoginPage';

type View = 'dashboard' | 'ecosystem' | 'workers' | 'positions' | 'absences' | 'assignments' | 'requisitions';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 text-neutral-400 font-mono text-xs">
        LOADING XOBIYA_HR_MODULE...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ecosystem', label: 'ERP Ecosystem', icon: LayoutDashboard },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'positions', label: 'Positions', icon: Briefcase },
    { id: 'absences', label: 'Absences', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: UserPlus },
    { id: 'requisitions', label: 'Requisitions', icon: FileText },
  ];

  return (
    <div className="h-screen flex bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#1E293B] flex flex-col z-20 relative border-r border-slate-200"
          >
            <div className="p-6 flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white ring-2 ring-blue-500/20 shrink-0">
                <Target size={18} />
              </div>
              <span className="font-bold tracking-tight text-lg text-white uppercase italic">xobiya HR</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Modules</p>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all rounded",
                    currentView === item.id 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  <item.icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto p-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 px-3 py-4 mb-2 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-white">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate uppercase tracking-tight">{user.role} Terminal</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-semibold">Exit System</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {navItems.find(i => i.id === currentView)?.label}
              </h2>
              <div className="hidden md:block px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                ERP Core Node
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Universal Research..." 
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
             </div>
             <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 border-l pl-6 border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="uppercase">Operational</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-7xl mx-auto"
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'ecosystem' && <Ecosystem />}
              {currentView === 'workers' && <Workers />}
              {currentView === 'positions' && <Positions />}
              {currentView === 'absences' && <Absences />}
              {currentView === 'assignments' && <Assignments />}
              {currentView === 'requisitions' && <Requisitions />}
            </motion.div>
          </AnimatePresence>

          <footer className="pt-10 flex items-center justify-between border-t border-slate-200 pt-8 mt-12 pb-4">
            <div className="flex gap-4 items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">xobiya.v1.0.ERP</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Environment: Production</span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              Last Sync: {new Date().toISOString().split('T')[0]} | MySQL Cluster
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
