import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Calendar, 
  ChevronDown, 
  DollarSign, 
  MessageSquare,
  PieChart as PieChartIcon,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#ef4444', '#f97316']; // User Revenue (Blue), Hala (Red), Spends (Orange)

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [comparison, setComparison] = useState({ userRevenue: 0, halaAmount: 0, adminSpends: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Operations',
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, compRes] = await Promise.all([
        api.get(`/expenses?month=${selectedMonth}`),
        api.get(`/analytics/profit-loss?month=${selectedMonth}`)
      ]);
      setExpenses(expRes.data.data);
      setComparison(compRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch expense data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        ...formData,
        month: selectedMonth,
        amount: Number(formData.amount)
      });
      setIsModalOpen(false);
      setFormData({ amount: '', category: 'Operations', remarks: '' });
      fetchData();
      toast.success('Expense added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this expense entry?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchData();
        toast.success('Expense removed');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const chartData = [
    { name: 'Gross Revenue', value: comparison.userRevenue },
    { name: 'Hala Amount', value: comparison.halaAmount },
    { name: 'Admin Spends', value: comparison.adminSpends },
  ].filter(d => d.value > 0);

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Admin Spends & P&L</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary-500" /> Financial Control Center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-8 py-2.5 rounded-xl font-bold appearance-none cursor-pointer hover:border-primary-500/50 transition-all outline-none shadow-sm"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const m = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{m}</option>;
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-glow-primary font-black uppercase text-xs tracking-widest"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison Chart */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 p-6 rounded-[2.5rem] shadow-xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-500 dark:text-primary-400 border border-primary-500/10">
                  <PieChartIcon size={24} />
                </div>
                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Revenue vs Costs</h3>
             </div>
             
             <div className="h-[300px] w-full">
               {loading ? (
                 <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>
               ) : chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={chartData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={90}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        formatter={(value) => `₹${value.toLocaleString()}`}
                        contentStyle={{ 
                         backgroundColor: '#0f172a', 
                         border: '1px solid #1e293b', 
                         borderRadius: '12px', 
                         fontSize: '12px', 
                         color: '#f8fafc',
                         boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                        }}
                      />
                     <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">No financial data<br/>for {selectedMonth}</div>
               )}
             </div>

             <div className="mt-6 p-4 bg-slate-50 dark:bg-dark-200/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase">Gross Revenue</span>
                    <span className="text-blue-500 font-black">₹{comparison.userRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase">Total Costs</span>
                    <span className="text-red-500 font-black">₹{(comparison.halaAmount + comparison.adminSpends).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Net Profit</span>
                    <span className={`text-sm font-black ${comparison.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ₹{comparison.netProfit.toLocaleString()}
                    </span>
                </div>
             </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-dark-200/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                <Receipt size={16} className="text-primary-500" /> Expense Ledger
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Total Spends</p>
                <p className="text-xs text-orange-500 font-black mt-1">₹ {comparison.adminSpends.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-dark-200/20">
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</th>
                    <th className="p-6 text-xs font-black text-primary-500 uppercase tracking-widest">Amount</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {loading ? (
                    <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="animate-spin text-primary-500 mx-auto" size={32} /></td></tr>
                  ) : paginatedExpenses.length > 0 ? (
                    paginatedExpenses.map((exp) => (
                      <tr key={exp._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-6 text-xs font-bold text-slate-500">
                          {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="p-6">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-6 text-xs text-slate-600 dark:text-slate-300 font-medium max-w-[200px] truncate">
                          {exp.remarks}
                        </td>
                        <td className="p-6 text-slate-900 dark:text-white font-black text-sm">
                          ₹ {exp.amount?.toLocaleString()}
                        </td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleDelete(exp._id)}
                            className="p-2.5 rounded-xl text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-32 text-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic opacity-50">Empty Ledger</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={expenses.length}
                itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Record Expense for ${selectedMonth}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Spend Amount (₹)</label>
              <input 
                name="amount"
                type="number" 
                required
                placeholder="0.00" 
                className="input h-12"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select 
                name="category"
                className="input h-12 appearance-none"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Salary">Salary</option>
                <option value="Rent">Rent</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MessageSquare size={14} /> Purpose / Description
            </label>
            <textarea 
              name="remarks"
              required
              className="input min-h-[100px] py-3 text-sm"
              placeholder="What was this spend for?"
              value={formData.remarks}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-secondary h-14 bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-400 font-bold rounded-2xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] btn-primary h-14 shadow-glow-primary rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <DollarSign size={20} />}
              <span>Commit Spend</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
