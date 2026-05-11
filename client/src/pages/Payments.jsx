import { useState, useEffect } from 'react';
import { CreditCard, Download, Search, Calendar, CalendarRange, ChevronDown, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function Payments() {
  const [data, setData] = useState({ stats: {}, riders: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = '/analytics/payments';
      if (isRangeMode && fromDate && toDate) {
        url = `/analytics/payments?startDate=${fromDate}&endDate=${toDate}`;
      } else if (!isRangeMode && selectedDate) {
        url = `/analytics/payments?date=${selectedDate}`;
      }
      const res = await api.get(url);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedDate, isRangeMode, fromDate, toDate]);

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

  const getWeekStats = (rider) => {
    const deployDate = rider.deployDate ? new Date(rider.deployDate) : null;
    const calculatedWeeks = (rider.deployDate && rider.returnDate)
      ? Math.max(0, Math.round((new Date(rider.returnDate) - new Date(rider.deployDate)) / (1000 * 60 * 60 * 24 * 7)))
      : 0;
    const paidWeeks = typeof rider.totalWeeks === 'number' ? Math.max(rider.totalWeeks, calculatedWeeks) : calculatedWeeks;
    
    if (!deployDate) {
      return {
        currentWeek: paidWeeks + 1,
        paidWeeks: paidWeeks,
        unpaidWeeks: rider.paymentStatus === 'unpaid' ? 1 : 0
      };
    }

    const referenceEnd = (isRangeMode && toDate)
      ? new Date(toDate)
      : (!isRangeMode && selectedDate)
        ? new Date(selectedDate)
        : new Date();

    const end = (rider.riderStatus === 'returned' && rider.returnDate && new Date(rider.returnDate) < referenceEnd) 
      ? new Date(rider.returnDate) 
      : referenceEnd;
    
    const diffTime = Math.abs(end - deployDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
    const unpaidWeeks = Math.max(0, currentWeek - paidWeeks);

    return {
      currentWeek,
      paidWeeks,
      unpaidWeeks
    };
  };

  const filteredRiders = data.riders.filter(rider => 
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    rider.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const unpaidRiders = data.riders.filter(r => getWeekStats(r).unpaidWeeks > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Payments Tracking</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Monitor rental transactions and upcoming dues</p>
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
            className={`px-4 py-2.5 h-11 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all border shadow-sm ${
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
              <div className="flex items-center gap-2 bg-white dark:bg-dark-100 px-3 py-2 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-black">
                <span className="text-[9px] font-black uppercase text-slate-400">From:</span>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-2 bg-white dark:bg-dark-100 px-3 py-2 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-black">
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
            /* Custom Date Filter */
            <div className="flex items-center gap-3 bg-white dark:bg-dark-100 px-4 py-2.5 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-black uppercase tracking-widest">
              <Calendar size={16} className="text-primary-500" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer border-0 p-0 text-slate-800 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                title="Filter payments as of date"
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
          )}

          <button 
            onClick={() => exportToCSV(data.riders, 'Payments_Report')}
            className="btn-secondary h-11 px-6 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold bg-white dark:bg-dark-100/50 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 shadow-sm rounded-2xl"
          >
            <Download size={18} /> Export Reports
          </button>
        </div>
      </div>

      {/* Dynamic Weekly Rental Tracker Info Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary-500/5 to-transparent border border-emerald-500/15 dark:border-emerald-500/10 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">How Weekly Payments Work</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Rental status is calculated automatically. Each week a rider occupies a bike (based on deployment date), they require <strong>1 Paid Week</strong>. If elapsed weeks exceed paid weeks, they are automatically flagged as <strong>UNPAID</strong>. Recording a payment dynamically credits 1 extra week, extends their due date by 7 days, and logs a fresh invoice.
            </p>
          </div>
        </div>
        <div className="flex gap-4 shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl">
          <div className="flex flex-col items-center px-3 border-r border-slate-200 dark:border-slate-800">
            <span className="text-slate-400">Deployed</span>
            <span className="text-slate-800 dark:text-white font-bold mt-1">Start Date</span>
          </div>
          <div className="flex flex-col items-center px-3 border-r border-slate-200 dark:border-slate-800">
            <span className="text-emerald-500">Every Payment</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">+1 Paid Week</span>
          </div>
          <div className="flex flex-col items-center px-3">
            <span className="text-orange-500">Due Date</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold mt-1">+7 Days</span>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Collected</p>
          <p className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{loading ? '...' : data.stats.totalCollected?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-orange-500 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pending Dues</p>
          <p className="text-3xl font-display font-black text-orange-600 dark:text-orange-400 mt-2">
            ₹{loading ? '...' : data.stats.pendingDues?.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Successful (On-Time)</p>
          <p className="text-3xl font-display font-black text-slate-900 dark:text-white mt-2">
            {loading ? '...' : data.stats.successfulCount}
          </p>
        </div>
        <div className="bg-primary-600/10 backdrop-blur-xl border border-primary-500/20 p-6 rounded-[2rem] shadow-glow-primary">
          <p className="text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-[0.3em]">Upcoming Total</p>
          <p className="text-3xl font-display font-black text-primary-600 dark:text-primary-400 mt-2">
            ₹{loading ? '...' : data.stats.upcomingTotal?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white dark:bg-dark-100/40 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">Transaction History</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text"
                placeholder="Search riders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-dark-200/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pl-12 pr-6 py-3 rounded-2xl w-full md:w-64 focus:outline-none focus:border-primary-500 transition-all font-bold text-sm"
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
              <tr className="bg-slate-50 dark:bg-slate-900/30">
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Rider</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Vehicle</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Due Date</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Amount</th>
                <th className="p-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-32 text-center">
                    <Loader2 className="animate-spin text-primary-500 mx-auto" size={40} />
                  </td>
                </tr>
              ) : paginatedRiders.length > 0 ? (
                paginatedRiders.map((rider) => (
                  <tr key={rider._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-8 font-bold text-slate-900 dark:text-white uppercase tracking-tight">{rider.name}</td>
                    <td className="p-8 font-mono text-slate-500 dark:text-slate-400 font-bold">{rider.vehicleNumber}</td>
                    <td className="p-8 font-bold text-slate-500 dark:text-slate-400">
                      {new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-8 text-slate-900 dark:text-white font-black">₹{(rider.rentalRate || data.stats.weeklyRate || 2000).toLocaleString()}</td>
                    <td className="p-8">
                      {(() => {
                        const stats = getWeekStats(rider);
                        return (
                          <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                            stats.unpaidWeeks > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {stats.unpaidWeeks > 0 ? <Calendar size={14} /> : <CheckCircle size={14} />}
                            {stats.unpaidWeeks > 0 ? `${stats.unpaidWeeks} Week(s) Unpaid` : `${stats.paidWeeks} Weeks Paid`}
                          </span>
                        );
                      })()}
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

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRiders.length}
          itemsPerPage={itemsPerPage}
        />
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
                <span className="text-lg font-black text-white">₹{(unpaidRiders.find(r => r._id === selectedRider)?.rentalRate || data.stats.weeklyRate || 2000).toLocaleString()}</span>
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
