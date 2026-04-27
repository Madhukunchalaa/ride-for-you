import { useState, useEffect } from 'react';
import { Send, Users, ShieldCheck, Loader2, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function WhatsAppCRM() {
  const [pastRidersCount, setPastRidersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/riders');
      const pastRiders = response.data.data.filter(r => r.riderStatus === 'inactive');
      setPastRidersCount(pastRiders.length);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReengage = async () => {
    if (pastRidersCount === 0) {
      toast.error('No past riders found to message.');
      return;
    }

    if (!confirm(`Are you sure you want to send a re-engagement message to all ${pastRidersCount} past riders?`)) {
      return;
    }

    try {
      setIsSending(true);
      toast.loading('Sending bulk messages...', { id: 'bulk-send' });
      
      const response = await api.post('/whatsapp/bulk-reengage');
      
      setStats(response.data);
      toast.success(`Successfully sent to ${response.data.successCount} riders!`, { id: 'bulk-send' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Bulk messaging failed', { id: 'bulk-send' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">
            WHATSAPP CRM
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
            <MessageSquare size={12} className="text-primary-500" />
            <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest">MARKETING HUB</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary-500" /> 
          Re-engage your past workforce and grow your fleet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Action Card */}
        <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary-600/10 transition-all duration-700" />
          
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-primary-600/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
              <Users size={32} />
            </div>

            <div>
              <h3 className="text-4xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {loading ? '...' : pastRidersCount}
              </h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Total Past Riders Available</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                Clicking the button below will send a professional WhatsApp message to every past rider in your database. 
                Use this to announce new bike arrivals or special weekly rates.
              </p>
            </div>

            <button 
              onClick={handleBulkReengage}
              disabled={isSending || loading || pastRidersCount === 0}
              className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl flex items-center justify-center gap-3 shadow-glow-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSending ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Re-engage All Past Riders</span>
                </>
              )}
            </button>

            {pastRidersCount === 0 && !loading && (
              <p className="text-[10px] text-orange-500 font-bold text-center uppercase tracking-widest animate-pulse">
                No inactive riders found to send messages.
              </p>
            )}
          </div>
        </div>

        {/* Right: Message Preview & Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <MessageSquare size={14} className="text-primary-500" />
              Message Preview (WhatsApp)
            </h4>
            
            <div className="bg-slate-800 rounded-2xl p-6 border-l-4 border-emerald-500 shadow-lg">
              <p className="text-slate-200 text-sm leading-relaxed font-medium">
                Hello <span className="text-emerald-400 font-bold">{"{Rider Name}"}</span>, we haven't seen you in a while! 🏍️ 
                Your favorite EV rentals at <span className="font-bold">*Ride For You*</span> are ready and waiting for your next trip. 
                Want to get back on the road today?
              </p>
            </div>
            
            <div className="mt-6 flex items-center gap-4 text-slate-500">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900" />)}
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Sent to real people</span>
            </div>
          </div>

          {stats && (
            <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-xl animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Last Campaign Status</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                   <p className="text-2xl font-black text-emerald-500">{stats.successCount}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Delivered</p>
                </div>
                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                   <p className="text-2xl font-black text-red-500">{stats.count - stats.successCount}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">Failed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Warning Alert */}
      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl flex gap-4">
        <AlertTriangle className="text-orange-500 shrink-0" size={24} />
        <div>
          <h5 className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">WhatsApp Spam Prevention</h5>
          <p className="text-xs text-orange-600/80 dark:text-orange-400/60 font-bold mt-1">
            Avoid sending this more than once per week. Sending too many messages to people who don't reply can lead to WhatsApp temporarily banning your number.
          </p>
        </div>
      </div>
    </div>
  );
}
