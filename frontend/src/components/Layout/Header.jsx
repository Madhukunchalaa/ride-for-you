import { useAuth } from '../../context/AuthContext';
import { User, Bell, Search } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-dark-100 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80 dark:bg-dark-100/80 transition-all duration-300">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight capitalize">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block overflow-hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search fleet, riders..." 
            className="bg-slate-100 dark:bg-dark-200/50 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6">
          <ThemeToggle />
          
          <button className="p-2.5 text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-white dark:border-dark-100"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 group cursor-pointer lg:bg-slate-100 dark:lg:bg-dark-200/50 lg:pl-3 lg:pr-1 lg:py-1 lg:rounded-full lg:border lg:border-slate-200 dark:lg:border-slate-800 hover:border-primary-500/30 transition-all">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">{user?.role || 'Root'}</p>
            </div>
            <div className="w-10 h-10 bg-primary-600/10 dark:bg-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/20 shadow-glow overflow-hidden group-hover:bg-primary-600 transition-all">
              <User size={20} className="text-primary-500 dark:text-primary-400 group-hover:text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
