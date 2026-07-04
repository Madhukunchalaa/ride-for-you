import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bike, 
  CreditCard, 
  Settings, 
  LogOut, 
  Zap,
  X,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Monitor,
  RotateCcw,
  MessageSquare
} from 'lucide-react';


import { useAuth } from '../../context/AuthContext';

const adminMenuItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/riders', label: 'Riders', icon: Users },
  { path: '/app/recovery', label: 'Recovery Bucket', icon: AlertCircle },
  { path: '/app/returns', label: 'Returns', icon: RotateCcw },
  { path: '/app/hala', label: 'Hala Details', icon: Bike },
  { path: '/app/payments', label: 'Payments', icon: CreditCard },
  { path: '/app/reports', label: 'Intelligence', icon: TrendingUp },
  { path: '/app/customers', label: 'Customers', icon: Users },
  { path: '/app/expenses', label: 'Admin Spends', icon: DollarSign },
  { path: '/app/landing-cms', label: 'Landing CMS', icon: Monitor },
  { path: '/app/whatsapp-crm', label: 'WhatsApp CRM', icon: MessageSquare },
  { path: '/app/settings', label: 'Settings', icon: Settings },
];

const employeeMenuItems = [
  { path: '/app/riders', label: 'Riders', icon: Users },
];


export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const menuItems = user?.role === 'employee' ? employeeMenuItems : adminMenuItems;

  return (
    <aside className={`
      w-64 bg-white dark:bg-dark-100 border-r border-slate-200 dark:border-slate-800 
      flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <Zap size={24} className="text-white" />
          </div>
          <span className="font-display font-black text-xl text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
            RIDE FOR YOU
          </span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => { if(window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold tracking-tight
              ${isActive 
                ? 'bg-primary-600/10 text-primary-500 dark:text-primary-400 border border-primary-500/20 shadow-glow-primary/5' 
                : 'text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
        >
          <LogOut size={20} />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
}
