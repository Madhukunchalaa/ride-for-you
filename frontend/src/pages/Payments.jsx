import { CreditCard, Download, Search, Calendar, ChevronDown } from 'lucide-react';

export default function Payments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-white">Payments Tracking</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Monitor rental transactions and upcoming dues</p>
        </div>
        <button className="btn-secondary px-6 border-slate-800 text-slate-300 font-bold bg-dark-100/50 hover:bg-slate-800 flex items-center gap-2">
          <Download size={18} /> Export Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-100 p-4 rounded-xl border border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Collected</p>
          <p className="text-xl font-display font-black text-emerald-400 mt-1 leading-none">₹5.2L</p>
        </div>
        <div className="bg-dark-100 p-4 rounded-xl border border-slate-800 border-l-orange-500/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Dues</p>
          <p className="text-xl font-display font-black text-orange-400 mt-1 leading-none">₹12,400</p>
        </div>
        <div className="bg-dark-100 p-4 rounded-xl border border-slate-800">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Successful</p>
          <p className="text-xl font-display font-black text-white mt-1 leading-none">1,240</p>
        </div>
        <div className="bg-dark-100 p-4 rounded-xl border border-slate-800 bg-primary-600/5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming Total</p>
          <p className="text-xl font-display font-black text-primary-400 mt-1 leading-none">₹45,000</p>
        </div>
      </div>

      <div className="bg-dark-100 rounded-3xl border border-slate-800 p-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <CreditCard size={36} className="text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Transaction History</h3>
        <p className="text-slate-500 mt-2 max-w-md">Detailed payment logs, receipt generation, and weekly rent tracking dashboard will appear here once the payment system is live.</p>
        <div className="flex gap-4 mt-8">
          <button className="btn-primary">Record Manual Payment</button>
          <button className="btn-secondary bg-slate-800/10 border-slate-800 text-slate-400">View Dues Calendar</button>
        </div>
      </div>
    </div>
  );
}
