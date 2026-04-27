import { CheckCircle2, Zap, Smartphone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-300 flex items-center justify-center p-6 font-display">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        
        {/* Success Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-20 animate-pulse" />
          <div className="relative w-24 h-24 bg-primary-600 rounded-[2rem] flex items-center justify-center shadow-glow-primary transform rotate-12 transition-transform hover:rotate-0 duration-500">
            <CheckCircle2 size={48} className="text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            PAYMENT <br />
            <span className="text-primary-500">SUCCESSFUL!</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Your rental has been extended automatically
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 dark:bg-dark-100/50 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] text-left space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="space-y-2">
            <h3 className="text-xs font-black text-primary-500 uppercase tracking-widest">Next Steps</h3>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Zap size={12} className="text-primary-500" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                A confirmation receipt has been sent to your WhatsApp.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Smartphone size={12} className="text-primary-500" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Keep the WhatsApp message for your records.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link 
            to="/"
            className="group w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          >
            Go to Homepage
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ride For You • EV Rental Solutions
          </p>
        </div>

      </div>
    </div>
  );
}
