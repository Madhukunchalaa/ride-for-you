import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Zap, 
  Calendar, 
  Receipt, 
  DollarSign, 
  MessageSquare, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  ChevronDown,
  PieChart as PieChartIcon,
  TrendingUp
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

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#a855f7'];

export default function Hala() {
  const [invoices, setInvoices] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Month Selection
  const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Form State
  const [formData, setFormData] = useState({
    billingMonth: selectedMonth,
    invoiceType: 'RENT',
    invoiceNum: '',
    billAmount: '',
    actualRent: '',
    remarks: ''
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invRes, distRes] = await Promise.all([
        api.get(`/invoices?month=${selectedMonth}`),
        api.get(`/analytics/billing?month=${selectedMonth}`)
      ]);
      setInvoices(invRes.data.data);
      setDistribution(distRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/invoices', {
        ...formData,
        billingMonth: selectedMonth,
        billAmount: Number(formData.billAmount),
        actualRent: Number(formData.actualRent)
      });
      setIsModalOpen(false);
      setFormData({
        billingMonth: selectedMonth,
        invoiceType: 'RENT',
        invoiceNum: '',
        billAmount: '',
        actualRent: '',
        remarks: ''
      });
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  const totalBillAmount = invoices.reduce((sum, inv) => sum + (inv.billAmount || 0), 0);
  const totalActualRent = invoices.reduce((sum, inv) => sum + (inv.actualRent || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Hala Analytics & Billing</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary-500" /> Operational Insights Dashboard
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
              {[0, 1, 2, 3, 4, 5].map(i => {
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
            <Plus size={18} /> Add Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics and Chart Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 p-6 rounded-[2.5rem] shadow-xl transition-all duration-300">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-500 dark:text-primary-400 border border-primary-500/10">
                  <PieChartIcon size={24} />
                </div>
                <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Cost Breakdown</h3>
             </div>
             
             <div className="h-[250px] w-full">
               {loading ? (
                 <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>
               ) : distribution.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={distribution}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {distribution.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ 
                        backgroundColor: 'var(--surface)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        fontSize: '10px', 
                        color: 'var(--text-primary)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                       }}
                     />
                     <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px', color: 'var(--text-secondary)' }} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] text-center px-10 leading-relaxed">No data for<br/>{selectedMonth}</div>
               )}
             </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-[2.5rem] shadow-glow-primary relative overflow-hidden group">
            <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">Total Clearance</p>
              <h4 className="text-4xl font-display font-black text-white mt-2">₹ {totalActualRent.toLocaleString()}</h4>
              <p className="text-xs text-white/50 mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> {selectedMonth} Status: Validated
              </p>
            </div>
          </div>
        </div>

        {/* Billing Table Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[3rem] overflow-hidden shadow-2xl h-full flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-dark-200/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                <Receipt size={16} className="text-primary-500" /> Ledger Details
              </h3>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter leading-none">Bill Total</p>
                  <p className="text-xs text-slate-900 dark:text-white font-black mt-1 leading-none">₹ {totalBillAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-dark-200/20">
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invoice Num</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="p-6 text-xs font-black text-primary-500 uppercase tracking-widest">Actual</th>
                    <th className="p-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {loading ? (
                    <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="animate-spin text-primary-500 mx-auto" size={32} /></td></tr>
                  ) : invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-6">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter border ${
                            inv.invoiceType === 'RENT' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                            inv.invoiceType === 'RECOVERY' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          }`}>
                            {inv.invoiceType}
                          </span>
                        </td>
                        <td className="p-6">
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{inv.invoiceNum}</p>
                        </td>
                        <td className="p-6 text-slate-900 dark:text-white font-black text-sm">₹ {inv.billAmount?.toLocaleString()}</td>
                        <td className="p-6">
                          <span className="text-sm font-black text-primary-600 dark:text-primary-400">₹ {inv.actualRent?.toLocaleString()}</span>
                        </td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleDelete(inv._id)}
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
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Add ${selectedMonth} Billing Entry`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Type</label>
              <select 
                name="invoiceType"
                className="input h-12 appearance-none"
                value={formData.invoiceType}
                onChange={handleInputChange}
                required
              >
                <option value="RENT">RENT</option>
                <option value="RECOVERY">RECOVERY</option>
                <option value="REPAIR & DAMAGE">REPAIR & DAMAGE</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Number</label>
              <input 
                name="invoiceNum"
                type="text" 
                required
                placeholder="Ex: HLSTS25260813" 
                className="input h-12 uppercase"
                value={formData.invoiceNum}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Bill Amount (₹)</label>
              <input 
                name="billAmount"
                type="number" 
                required
                placeholder="0.00" 
                className="input h-12"
                value={formData.billAmount}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-xs font-black text-primary-500 uppercase tracking-widest ml-1">Actually Rent (₹)</label>
              <input 
                name="actualRent"
                type="number" 
                required
                placeholder="0.00" 
                className="input h-12 border-primary-500/30 focus:border-primary-500 focus:bg-primary-500/5"
                value={formData.actualRent}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MessageSquare size={14} /> Remarks / Observations
            </label>
            <textarea 
              name="remarks"
              className="input min-h-[100px] py-3 text-sm"
              placeholder="Add any specific notes about this billing entry..."
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
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Receipt size={20} />
                  <span>Commit Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
