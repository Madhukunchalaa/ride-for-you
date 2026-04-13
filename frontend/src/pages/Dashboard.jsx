import { useState, useEffect } from 'react';
import { 
  Users, 
  Bike, 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  Loader2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import api from '../api/axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setData(response.data.data);
      } catch (err) {
        console.error('Analytics Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary-500" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Generating Real-Time Insights...</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Riders', value: data?.stats?.totalRiders || 0, icon: Users, color: 'text-primary-400', bg: 'bg-primary-600/10' },
    { label: 'Active Fleet', value: data?.stats?.activeRiders || 0, icon: Bike, color: 'text-sky-400', bg: 'bg-sky-600/10' },
    { label: 'Pending Dues', value: '₹4,320', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-600/10' }, // Static for now as per image
    { label: 'Total Revenue', value: `₹${(data?.stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-dark-100 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl hover:border-primary-500/30 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-2xl font-display font-black text-slate-900 dark:text-white mt-1 leading-none">{stat.value}</p>
              </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue/Registration Trend Chart */}
        <div className="lg:col-span-2 bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Fleet Growth Trend</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Rider registrations over last 7 days</p>
            </div>
            <div className="bg-primary-600/10 border border-primary-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-primary-400 font-black uppercase tracking-tighter">Live Monitor</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.riderTrend || []}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#1e293b]" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTrend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 flex items-center justify-center text-sky-400">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Recent Onboarding</h3>
          </div>
          
          <div className="space-y-6">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-primary-600/10 group-hover:text-primary-400 group-hover:border-primary-500/30 transition-all duration-300">
                    <Users size={20} />
                  </div>
                  <div className="flex-1 border-b border-slate-200 dark:border-slate-800/50 pb-4 group-last:border-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors uppercase tracking-tight">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.vehicleNumber}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-600 font-bold">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <AlertCircle size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest leading-loose">No recent activity<br/>to monitor</p>
              </div>
            )}
          </div>
          
          <button className="w-full mt-8 py-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
