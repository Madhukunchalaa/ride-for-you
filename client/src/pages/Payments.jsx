import { useState, useEffect } from 'react';
import { CreditCard, Download, Search, Calendar, ChevronDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

export default function Payments() {
  const [data, setData] = useState({ stats: {}, riders: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/payments');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedRider) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/riders/${selectedRider}/status`, { paymentStatus: 'paid' });
      setIsModalOpen(false);
      setSelectedRider('');
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRiders = data.riders.filter(rider => 
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    rider.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unpaidRiders = data.riders.filter(r => r.paymentStatus === 'unpaid');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase">Payments Tracking</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Monitor rental transactions and upcoming dues</p>
        </div>
        <button className="btn-secondary px-6 border-slate-800 text-slate-300 font-bold bg-dark-100/50 hover:bg-slate-800 flex items-center gap-2">
          <Download size={18} /> Export Reports
        </button>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-dark-100/40 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Collected</p>
          <p className="text-3xl font-display font-black text-emerald-400 mt-2">
            ₹{loading ? '...' : data.stats.totalCollected?.toLocaleString()}
          </p>
        </div>
        <div className="bg-dark-100/40 backdrop-blur-xl border border-slate-800 border-l-4 border-l-orange-500 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pending Dues</p>
          <p className="text-3xl font-display font-black text-orange-400 mt-2">
            ₹{loading ? '...' : data.stats.pendingDues?.toLocaleString()}
          </p>
        </div>
        <div className="bg-dark-100/40 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Successful</p>
          <p className="text-3xl font-display font-black text-white mt-2">
            {loading ? '...' : data.stats.successfulCount}
          </p>
        </div>
        <div className="bg-primary-600/10 backdrop-blur-xl border border-primary-500/20 p-6 rounded-[2rem] shadow-glow-primary">
          <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Upcoming Total</p>
          <p className="text-3xl font-display font-black text-primary-400 mt-2">
            ₹{loading ? '...' : data.stats.upcomingTotal?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-dark-100/40 backdrop-blur-3xl border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Transaction History</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Search riders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-dark-200/50 border border-slate-800 text-white pl-12 pr-6 py-3 rounded-2xl w-full md:w-64 focus:outline-none focus:border-primary-500 transition-all font-bold text-sm"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2 font-black uppercase text-xs tracking-widest py-3 px-6"
            >
              Record Manual Payment
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/30">
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Rider</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Vehicle</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Due Date</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Amount</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-32 text-center">
                    <Loader2 className="animate-spin text-primary-500 mx-auto" size={40} />
                  </td>
                </tr>
              ) : filteredRiders.length > 0 ? (
                filteredRiders.map((rider) => (
                  <tr key={rider._id} className="group hover:bg-slate-800/10 transition-colors">
                    <td className="p-8 font-bold text-white uppercase tracking-tight">{rider.name}</td>
                    <td className="p-8 font-mono text-slate-400 font-bold">{rider.vehicleNumber}</td>
                    <td className="p-8 font-bold text-slate-400">
                      {new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-8 text-white font-black">₹2,000</td>
                    <td className="p-8">
                      <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                        rider.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        {rider.paymentStatus === 'paid' ? <CheckCircle size={14} /> : <Calendar size={14} />}
                        {rider.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-32 text-center text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-50">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Payment"
      >
        <form onSubmit={handleRecordPayment} className="space-y-6">
          <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-2xl">
            <p className="text-xs font-bold text-primary-400 leading-relaxed uppercase tracking-wider">
              Mark a rider's weekly rental as paid. This will update the dashboard and transaction history immediately.
            </p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Select Pending Rider</label>
            <div className="relative">
              <select 
                value={selectedRider}
                onChange={(e) => setSelectedRider(e.target.value)}
                required
                className="w-full bg-dark-200 border border-slate-800 text-white px-6 py-4 rounded-2xl font-bold appearance-none outline-none focus:border-primary-500 transition-all shadow-xl"
              >
                <option value="">Choose a rider...</option>
                {unpaidRiders.map(rider => (
                  <option key={rider._id} value={rider._id}>
                    {rider.name} - {rider.vehicleNumber}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
            </div>
          </div>

          {selectedRider && (
            <div className="p-6 bg-dark-200 border border-slate-800 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rental Amount</span>
                <span className="text-lg font-black text-white">₹2,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payment Method</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/5">MANUAL CASH / UPI</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-secondary py-5 bg-slate-800/10 text-slate-400 border-slate-800 rounded-[1.5rem]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedRider}
              className="flex-[2] btn-primary py-5 shadow-glow-primary rounded-[1.5rem] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
