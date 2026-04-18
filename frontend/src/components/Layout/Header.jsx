import { useAuth } from '../../context/AuthContext';
import { User, Bell, Search, Menu, Zap } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function Header({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-dark-100 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80 dark:bg-dark-100/80 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-primary-500/10 hover:text-primary-500 transition-all border border-slate-200 dark:border-slate-700/50"
        >
          <Menu size={22} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{title}</h1>
        </div>
        {/* Mobile Logo for Header */}
        <div className="sm:hidden flex items-center gap-2">
           <Zap size={20} className="text-primary-500" />
           <span className="font-display font-black text-sm text-slate-900 dark:text-white tracking-tighter uppercase leading-none">RIDE FOR YOU</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 border-l border-slate-200 dark:border-slate-800 pl-4 md:pl-6 leading-none">
        <div className="hidden lg:flex relative overflow-hidden h-10 items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search fleet, riders..." 
            className="bg-slate-100 dark:bg-dark-200/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary-500 transition-all w-64 h-full"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <button className="p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all relative hidden xs:flex">
             <Bell size={20} />
             <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-100"></span>
          </button>
          
          <div className="flex items-center gap-3 group cursor-pointer lg:bg-slate-100 dark:lg:bg-dark-200/50 lg:pl-3 lg:pr-1 lg:py-1 lg:rounded-xl lg:border lg:border-slate-200 dark:lg:border-slate-800 hover:border-primary-500/30 transition-all h-10">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">System Admin</p>
              <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest mt-0.5">{user?.role || 'Root Access'}</p>
            </div>
            <div className="w-9 h-9 bg-primary-600/10 dark:bg-primary-600/20 rounded-lg flex items-center justify-center border border-primary-500/20 shadow-glow overflow-hidden group-hover:bg-primary-600 group-hover:text-white transition-all text-primary-500">
               <User size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
