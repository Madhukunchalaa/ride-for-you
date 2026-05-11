import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  ArrowDownCircle, 
  DollarSign, 
  Download, 
  Loader2, 
  Calendar,
  Filter
} from 'lucide-react';
import api from '../api/axios';
import { exportToCSV } from '../utils/exportUtils';

export default function Reports() {
  const [range, setRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        let url = `/analytics/reports?range=${range}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        const response = await api.get(url);
        setData(response.data.data);
      } catch (err) {
        console.error('Reports Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [range, startDate, endDate]);

  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.halaPayments, 0);
  const totalProfit = totalEarnings - totalExpenses;

  const summaryStats = [
    { label: 'Cumulative Revenue', value: `₹${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Hala Payments', value: `₹${totalExpenses.toLocaleString()}`, icon: ArrowDownCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Net Profit', value: `₹${totalProfit.toLocaleString()}`, icon: DollarSign, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Financial Intelligence</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
            <Filter size={16} className="text-primary-500" /> Revenue vs Hala Expenditure
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Date Range Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-dark-100 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-black uppercase tracking-widest">
            <Calendar size={14} className="text-primary-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setRange('daily'); // Switch to daily for granular range analysis
              }}
              className="bg-transparent focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white w-28 [color-scheme:light] dark:[color-scheme:dark]"
              title="Start Date"
            />
            <span className="text-slate-400 text-[10px]">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setRange('daily');
              }}
              className="bg-transparent focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white w-28 [color-scheme:light] dark:[color-scheme:dark]"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setRange('monthly');
                }}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 px-2 py-1 rounded-lg transition-all ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-dark-200/50 p-1 rounded-2xl flex">
            <button 
              onClick={() => setRange('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${range === 'daily' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setRange('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${range === 'weekly' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setRange('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${range === 'monthly' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Monthly
            </button>
          </div>

          <button 
            onClick={() => exportToCSV(data, 'Financial_Report')}
            className="p-3 bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary-500 transition-all shadow-sm"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-dark-100 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:scale-[1.02]">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</p>
            <p className="text-2xl font-display font-black text-slate-900 dark:text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/40 dark:bg-dark-100/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="text-primary-500" size={24} />
          <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Performance Comparison</h3>
        </div>

        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data].reverse()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[#1e293b]" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    if (range === 'monthly') {
                      return new Date(val).toLocaleDateString('default', { month: 'short', year: '2-digit' });
                    }
                    if (range === 'daily') {
                      return new Date(val).toLocaleDateString('default', { day: '2-digit', month: 'short' });
                    }
                    return val;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '16px', 
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="earnings" name="Gross Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="halaPayments" name="Hala Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="profit" name="Net Profit" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-[0.3em]">No data available</div>
          )}
        </div>
      </div>
      
      <div className="bg-slate-900 dark:bg-dark-100 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h4 className="text-white font-display font-black text-xl uppercase tracking-tight">Business Vitality Score</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Based on Profit vs. Expense ratio</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-primary-400 font-black uppercase tracking-widest">ROI Estimate</p>
              <p className="text-3xl text-white font-display font-black">
                {totalExpenses > 0 ? ((totalProfit / totalExpenses) * 100).toFixed(1) : '100'}%
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary-500 flex items-center justify-center text-primary-500 font-black italic shadow-glow-primary">
              EXL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
