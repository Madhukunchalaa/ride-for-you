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
  CalendarRange,
  CheckCircle2,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import api from '../api/axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let url = `/analytics/dashboard?timeframe=${timeframe}`;
        if (isRangeMode && fromDate && toDate) {
          url = `/analytics/dashboard?startDate=${fromDate}&endDate=${toDate}`;
        } else if (!isRangeMode && selectedDate) {
          url = `/analytics/dashboard?date=${selectedDate}`;
        }
        const response = await api.get(url);
        setData(response.data.data);
      } catch (err) {
        console.error('Analytics Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeframe, selectedDate, isRangeMode, fromDate, toDate]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary-500" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Generating Real-Time Insights...</p>
      </div>
    );
  }

  const getTimeframeLabel = () => {
    if (isRangeMode) return 'Range';
    if (selectedDate) return 'Selected Date';
    if (timeframe === 'today') return "Today's";
    if (timeframe === 'weekly') return 'Weekly';
    if (timeframe === 'monthly') return 'Monthly';
    if (timeframe === 'yearly') return 'Yearly';
    if (timeframe === 'all') return 'All-Time';
    return 'Weekly';
  };

  const stats = [
    { label: `${getTimeframeLabel()} Profit`, value: `₹${(data?.stats?.adminProfit || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-600/10' },
    { label: `${getTimeframeLabel()} Active Fleet`, value: data?.stats?.activeRiders || 0, icon: Bike, color: 'text-sky-400', bg: 'bg-sky-600/10' },
    { label: `${getTimeframeLabel()} Pending`, value: `₹${(data?.stats?.pendingDues || 0).toLocaleString('en-IN')}`, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-600/10' },
    { label: `${getTimeframeLabel()} Revenue`, value: `₹${(data?.stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { label: 'Total SD', value: `₹${(data?.stats?.totalSD || 0).toLocaleString('en-IN')}`, icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header with Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard Overview</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time performance analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Range Mode Button */}
          <button
            onClick={() => {
              setIsRangeMode(!isRangeMode);
              setFromDate('');
              setToDate('');
              setSelectedDate('');
            }}
            className={`px-4 py-2.5 h-12 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all border shadow-sm ${
              isRangeMode 
                ? 'bg-primary-500 text-black border-primary-500 hover:bg-primary-400' 
                : 'bg-white dark:bg-dark-100 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <CalendarRange size={15} />
            <span>{isRangeMode ? 'Switch to Standard' : 'Custom Date Range'}</span>
          </button>

          {isRangeMode ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* From Date */}
              <div className="flex items-center gap-2 bg-white dark:bg-dark-100 px-3 py-2 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[9px] font-black uppercase text-slate-400">From:</span>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-2 bg-white dark:bg-dark-100 px-3 py-2 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[9px] font-black uppercase text-slate-400">To:</span>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {(fromDate || toDate) && (
                <button 
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 px-2.5 py-1.5 rounded-xl transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Custom Date Filter */}
              <div className="flex items-center gap-3 bg-white dark:bg-dark-100 px-4 py-2 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Calendar size={16} className="text-primary-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  title="Filter by specific date"
                />
                {selectedDate && (
                  <button 
                    onClick={() => setSelectedDate('')}
                    className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 px-2 py-1 rounded-lg transition-all ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Standard Timeframe Filter */}
              {!selectedDate && (
                <div className="flex items-center gap-3 bg-white dark:bg-dark-100 p-2 h-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Calendar size={16} className="text-primary-500 ml-2" />
                  <select 
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="bg-transparent text-[10px] md:text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer pr-4 text-slate-800 dark:text-white bg-white dark:bg-dark-100 border-none"
                  >
                    <option value="today">Today's View</option>
                    <option value="weekly">Weekly View</option>
                    <option value="monthly">Monthly View</option>
                    <option value="yearly">Yearly View</option>
                    <option value="all">Total (All-Time)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-dark-100 p-6 rounded-3xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl hover:border-primary-500/30 transition-all group overflow-hidden relative">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                <stat.icon size={24} className="md:w-7 md:h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-white mt-1 leading-none">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Fleet Growth Trend Chart */}
        <div className="lg:col-span-2 bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Fleet Growth Trend</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                {isRangeMode ? `Rider registrations (${fromDate || 'Start'} to ${toDate || 'End'})` : selectedDate ? `Rider registrations (Leading up to ${getTimeframeLabel()})` : `Rider registrations (Last 7 Days)`}
              </p>
            </div>
            <div className="bg-primary-600/10 border border-primary-500/20 px-3 py-1 rounded-full flex items-center gap-2 w-fit">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-primary-400 font-black uppercase tracking-tighter">Live Monitor</span>
            </div>
          </div>
          
          <div className="h-[250px] md:h-[300px] w-full mt-4">
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
        
        {/* Recent Onboarding */}
        <div className="bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 flex items-center justify-center text-sky-400">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Recent Onboarding</h3>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                    item.type === 'EXTENSION' 
                    ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' 
                    : 'bg-primary-600/10 text-primary-500 border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white'
                  }`}>
                    {item.type === 'EXTENSION' ? <TrendingUp size={18} /> : <Users size={18} />}
                  </div>
                  <div className="flex-1 border-b border-slate-200 dark:border-slate-800/50 pb-3 md:pb-4 group-last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white transition-colors uppercase tracking-tight">{item.name}</p>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                        item.type === 'EXTENSION' ? 'bg-emerald-500 text-white' : 'bg-primary-500 text-white'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.vehicleNumber}</span>
                      <span className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-600 font-bold">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 md:py-20 text-center">
                <AlertCircle size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest leading-loose">No recent activity</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 md:mt-8 py-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700">
            View All Activity
          </button>
        </div>
      </div>

      {/* Row 3: Revenue Performance */}
      <div className="bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Revenue Collection</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
              {isRangeMode ? `Daily income trends (${fromDate || 'Start'} to ${toDate || 'End'})` : selectedDate ? `Daily income trends (Leading up to ${getTimeframeLabel()})` : `Daily income trends (Last 7 Days)`}
            </p>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2 w-fit">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">INR Collected</span>
          </div>
        </div>
        
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueTrend || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRev)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
