import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Plus, Search, Filter, Phone, Calendar, Car, ShieldCheck, X, Loader2, MoreVertical, ExternalLink, Send, CreditCard, CheckCircle2, Trash2, Edit2, RotateCcw, FilterX, Wrench, ChevronDown, CalendarRange, XCircle, MessageSquare, Download } from 'lucide-react';

import api from '../api/axios';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [damageRider, setDamageRider] = useState(null);
  const [paymentRider, setPaymentRider] = useState(null);
  const [damageData, setDamageData] = useState({ amount: '', reason: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', remarks: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const location = useLocation();
  const isRecoveryPage = location.pathname.includes('/recovery');
  const isReturnsPage = location.pathname.includes('/returns');

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [dateFilterType, setDateFilterType] = useState('returnDate'); // Default to 'returnDate' (Due Date) as requested
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [openActionMenu, setOpenActionMenu] = useState(null);


  useEffect(() => {
    if (isRecoveryPage) {
      setActiveTab('recovery');
    } else if (isReturnsPage) {
      setActiveTab('returned');
    } else {
      setActiveTab('active');
    }
  }, [isRecoveryPage, isReturnsPage]);


  // --- PhonePe Payment Logic ---
  const handlePayment = async (rider) => {
    try {
      toast.loading("Generating PhonePe Checkout Link...", { id: "pp-link" });
      const amount = rider.whatsappNumber === '7095682464' ? 1 : 2000;
      const { data } = await api.post('/payments/create-link', {
        riderId: rider._id,
        amount: amount
      });

      if (data.success && data.url) {
        toast.dismiss("pp-link");
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast.dismiss("pp-link");
      const errorMsg = err.response?.data?.message || err.message;
      toast.error("Error initiating payment: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
    }
  };

  const handleSendReminder = async (riderId) => {
    try {
      setSendingReminder(riderId);
      await api.post(`/riders/${riderId}/send-reminder`);
      toast.success('Reminder sent successfully!');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to send reminder';
      toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    } finally {
      setSendingReminder(null);
    }
  };

  const handleUpdateStatus = async (riderId, updateData) => {
    try {
      const payload = typeof updateData === 'string' ? { paymentStatus: updateData } : updateData;
      await api.patch(`/riders/${riderId}/status`, payload);
      toast.success('Status updated successfully');
      fetchRiders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleManualWhatsApp = (rider) => {
    const phone = (rider.whatsappNumber || "").replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? '91' + phone : phone;
    const message = `Hello *${rider.name}*,\n\nThis is a reminder from *Ride For You* regarding your vehicle *${rider.vehicleNumber}*.\n\nYour weekly rental payment is due. Please use your payment link to pay and avoid any late fees. If you haven't received the link, please let us know.\n\nThank you!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDeleteRider = async (id) => {
    if (confirm('Are you sure you want to end this rental and archive the rider?')) {
      try {
        await api.patch(`/riders/${id}/status`, { riderStatus: 'inactive' });
        toast.success('Rider archived successfully');
        fetchRiders();
      } catch (err) {
        toast.error('Failed to archive rider');
      }
    }
  };

  const submitDamage = async (e) => {
    e.preventDefault();
    if (!damageData.amount || !damageData.reason) {
      toast.error('Amount and reason are required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post(`/riders/${damageRider._id}/damage`, {
        amount: Number(damageData.amount),
        reason: damageData.reason
      });
      toast.success('Damage recorded and payment link sent via WhatsApp!');
      setIsDamageModalOpen(false);
      setDamageData({ amount: '', reason: '' });
      setDamageRider(null);
      fetchRiders(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record damage');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    riderStatus: 'active',
    vehicleNumber: '',
    deployDate: '',
    returnDate: '',
    autoReminderEnabled: true,
    autoReminderTime: '00:00',
    securityDeposit: '',
    rentalRate: ''
  });

  const fetchRiders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get('/riders');
      setRiders(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch riders. Please try again.');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(() => {
      fetchRiders(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (formData.deployDate) {
      const deploy = new Date(formData.deployDate);
      if (!isNaN(deploy.getTime())) {
        const returnD = new Date(deploy);
        returnD.setDate(deploy.getDate() + 7);
        setFormData(prev => ({
          ...prev,
          returnDate: returnD.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.deployDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/riders/${editId}`, formData);
      } else {
        await api.post('/riders', formData);
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchRiders();
      toast.success(isEditing ? 'Profile updated successfully' : 'Rider registered successfully');

    } catch (err) {
      alert(err.response?.data?.message || 'Error saving rider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: '',
      whatsappNumber: '',
      riderStatus: 'active',
      vehicleNumber: '',
      deployDate: '',
      returnDate: '',
      autoReminderEnabled: true,
      autoReminderTime: '00:00',
      securityDeposit: '',
      rentalRate: ''
    });
  };

  const handleEditClick = (rider) => {
    setIsEditing(true);
    setEditId(rider._id);
    setFormData({
      name: rider.name || '',
      whatsappNumber: rider.whatsappNumber || '',
      riderStatus: rider.isRecoveryBucket ? 'recovery' : (rider.riderStatus || 'active'),
      vehicleNumber: rider.vehicleNumber || '',
      deployDate: rider.deployDate ? new Date(rider.deployDate).toISOString().split('T')[0] : '',
      returnDate: rider.returnDate ? new Date(rider.returnDate).toISOString().split('T')[0] : '',
      autoReminderEnabled: rider.autoReminderEnabled ?? true,
      autoReminderTime: rider.autoReminderTime || '00:00',
      securityDeposit: rider.securityDeposit || '',
      rentalRate: rider.rentalRate || ''
    });
    setIsModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredRiders = riders.filter(rider => {
    let isCorrectTab = (rider.riderStatus || 'active') === activeTab;
    
    if (activeTab === 'recovery') {
      isCorrectTab = rider.isRecoveryBucket === true && rider.riderStatus !== 'returned' && rider.riderStatus !== 'inactive';
    } else if (activeTab === 'active') {
      isCorrectTab = rider.riderStatus === 'active' && !rider.isRecoveryBucket;
    } else if (activeTab === 'returned') {
      isCorrectTab = rider.riderStatus === 'returned';
    } else if (activeTab === 'inactive') {
      isCorrectTab = rider.riderStatus === 'inactive';
    }

    const matchesSearch = rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rider.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rider.whatsappNumber.includes(searchTerm);

    const matchesDate = (() => {
      if (!filterDate) return true;
      const dateVal = rider[dateFilterType];
      if (!dateVal) return false;
      
      // Normalize to YYYY-MM-DD for string comparison
      const targetDateStr = new Date(dateVal).toISOString().split('T')[0];
      return targetDateStr === filterDate;
    })();

    const matchesPayment = paymentFilter === 'all' || rider.paymentStatus === paymentFilter;

    return isCorrectTab && matchesSearch && matchesDate && matchesPayment;
  });

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterDate, dateFilterType, itemsPerPage]);

  const clearFilters = () => {
    setFilterDate('');
    setSearchTerm('');
    setPaymentFilter('all');
    setItemsPerPage(50);
    setShowFilters(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {isRecoveryPage ? 'RECOVERY BUCKET' : isReturnsPage ? 'RETURNED FLEET' : 'RIDER MANAGEMENT'}
          </h2>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">LIVE SYNC</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary-500" /> 
          {isRecoveryPage ? 'Defaulters & High Risk Database' : isReturnsPage ? 'Inventory of Returned Vehicles' : 'Secure Workforce Database'}
        </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToCSV(filteredRiders, 'Riders_List')}
            className="p-3 bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary-500 transition-all shadow-sm"
            title="Export filtered list"
          >
            <Download size={20} />
          </button>
          {(!isRecoveryPage && !isReturnsPage) && (
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3 shadow-glow-primary group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add New Rider</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Controls */}
      {(!isRecoveryPage && !isReturnsPage) && (
        <div className="flex bg-slate-200/50 dark:bg-dark-200/50 p-1 rounded-2xl w-fit mb-4 border border-slate-200 dark:border-slate-800/50">
          <button 
            onClick={() => setActiveTab('active')} 
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-800 shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Active Fleet
          </button>
          <button 
            onClick={() => setActiveTab('returned')} 
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'returned' ? 'bg-white dark:bg-slate-800 shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Returned
          </button>
        </div>
      )}


      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, vehicle number or phone..." 
              className="input pl-12 h-14 bg-white dark:bg-dark-200/50 border-slate-200 dark:border-slate-800/50 focus:border-primary-500/50 focus:bg-white dark:focus:bg-dark-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all border shadow-sm ${showFilters ? 'bg-primary-500 text-black border-primary-500' : 'bg-white dark:bg-dark-200/50 border-slate-300 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Filter size={18} /> 
            <span>{showFilters ? 'Hide Filters' : 'Advanced Filters'}</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-dark-100/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filter By</label>
                <div className="relative">
                  <select 
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    className="input h-12 appearance-none bg-slate-50 dark:bg-dark-200/50"
                  >
                    <option value="deployDate">Deployment Date</option>
                    <option value="returnDate">Return Date</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Select Specific {dateFilterType === 'deployDate' ? 'Deployment' : 'Due'} Date
                </label>
                <div className="relative">
                  <CalendarRange size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="input h-12 pl-12 bg-slate-50 dark:bg-dark-200/50 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Status</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                  <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="input h-12 pl-12 appearance-none bg-slate-50 dark:bg-dark-200/50"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid Only</option>
                    <option value="unpaid">Unpaid Only</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rows Per Page</label>
                <div className="relative">
                  <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
                  <select 
                    value={itemsPerPage === 999999 ? 'all' : itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 999999 : Number(e.target.value))}
                    className="input h-12 pl-12 appearance-none bg-slate-50 dark:bg-dark-200/50"
                  >
                    <option value={25}>25 Rows</option>
                    <option value={50}>50 Rows</option>
                    <option value={100}>100 Rows</option>
                    <option value="all">All Rows</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={clearFilters}
                  className="w-full h-12 flex items-center justify-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <FilterX size={16} /> Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content - Adaptive View */}
      <div className="space-y-4 md:space-y-0">
        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 bg-white dark:bg-dark-100/40 rounded-[2rem] border border-slate-200 dark:border-slate-800">
               <Loader2 size={32} className="text-primary-500 animate-spin" />
               <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Fleet...</span>
            </div>
          ) : paginatedRiders.length > 0 ? (
            paginatedRiders.map((rider) => (
              <div key={rider._id} className="bg-white dark:bg-dark-100/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/10 dark:bg-primary-600/5 border border-primary-500/20 flex items-center justify-center text-primary-500">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <Link to={`/app/riders/${rider._id}`} className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight block hover:text-primary-500 transition-colors">
                      {rider.name}
                    </Link>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Phone size={10} className="text-primary-500/70" /> {rider.whatsappNumber}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-primary-500/20 bg-primary-500/5 text-primary-400`}>
                    {rider.vehicleNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-slate-50 dark:bg-dark-200/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                   <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Return Date</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatDate(rider.returnDate)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Subscription</p>
                      <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-black uppercase tracking-widest text-primary-500`}>
                          Week {(rider.totalWeeks || 0) + 1} Running
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${rider.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {rider.totalWeeks || 0} Weeks Paid
                        </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSendReminder(rider._id)}
                    disabled={sendingReminder === rider._id}
                    className="flex-1 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {sendingReminder === rider._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">Remind</span>
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setOpenActionMenu(openActionMenu === rider._id ? null : rider._id)}
                      className="h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openActionMenu === String(rider._id) && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                        <button onClick={() => { handlePayment(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          <CreditCard size={16} className="text-primary-500" /> Pay Now
                        </button>
                        <button onClick={() => { handleUpdateStatus(rider._id, rider.paymentStatus === 'paid' ? 'unpaid' : 'paid'); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          {rider.paymentStatus === 'paid' ? <XCircle size={16} className="text-orange-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />} 
                          Mark as {rider.paymentStatus === 'paid' ? 'Unpaid' : 'Paid'}
                        </button>
                        <button onClick={() => { handleManualWhatsApp(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-b border-slate-100 dark:border-slate-800/50">
                          <MessageSquare size={16} className="text-emerald-500" /> Personal WhatsApp
                        </button>
                        <button onClick={() => { handleUpdateStatus(rider._id, { riderStatus: 'returned' }); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          <RotateCcw size={16} className="text-blue-500" /> Mark Returned
                        </button>
                        <button onClick={() => { setDamageRider(rider); setIsDamageModalOpen(true); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          <Wrench size={16} className="text-red-500" /> Record Damage
                        </button>
                        <button onClick={() => { handleEditClick(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          <Edit2 size={16} className="text-slate-400" /> Edit Profile
                        </button>
                        <Link to={`/app/riders/${rider._id}`} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
                          <ExternalLink size={16} className="text-slate-400" /> Full History
                        </Link>
                        <button onClick={() => { handleDeleteRider(rider._id); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={16} /> Delete Rider
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="py-12 bg-white dark:bg-dark-100/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Riders Found</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-dark-200/30">
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Rider Details</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Vehicle No.</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Deploy Date</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{isReturnsPage ? 'Date Returned' : 'Next Return'}</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{isReturnsPage ? 'Total Tenure' : 'Status'}</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Payment</th>
                  <th className="p-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 size={40} className="text-primary-500 animate-spin" />
                        <span className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Fleet Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRiders.length > 0 ? (
                  paginatedRiders.map((rider) => (
                    <tr key={rider._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-600/10 dark:bg-primary-600/5 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Users size={24} />
                          </div>
                          <div>
                            <Link 
                              to={`/app/riders/${rider._id}`}
                              className="text-slate-900 dark:text-white font-black hover:text-primary-600 dark:hover:text-primary-400 transition-colors capitalize underline-offset-4 hover:underline"
                            >
                              {rider.name}
                            </Link>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-bold">
                              <Phone size={12} className="text-primary-500/70" /> {rider.whatsappNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-sm font-mono text-primary-700 dark:text-primary-300 font-black bg-primary-500/5 px-3 py-1.5 rounded-xl border border-primary-500/10">
                          {rider.vehicleNumber}
                        </span>
                      </td>
                      <td className="p-6 text-sm text-slate-600 dark:text-slate-300 font-bold">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                          {formatDate(rider.deployDate)}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`flex items-center gap-2 text-sm font-black w-fit px-3 py-1 rounded-lg ${isReturnsPage ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-primary-500/10 text-primary-700 dark:text-primary-300'}`}>
                          <Calendar size={14} className={isReturnsPage ? 'text-blue-600 dark:text-blue-500' : 'text-primary-600 dark:text-primary-500'} />
                          {formatDate(rider.returnDate)}
                        </div>
                      </td>
                      <td className="p-6">
                        {isReturnsPage ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase">
                              {(() => {
                                const start = new Date(rider.deployDate);
                                const end = new Date(rider.returnDate);
                                const diff = Math.abs(end - start);
                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                return `${Math.floor(days/7)}W ${days%7}D`;
                              })()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Tenure</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${
                              rider.riderStatus === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                              : rider.riderStatus === 'returned'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                            }`}>
                              {rider.riderStatus}
                            </span>
                            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 mt-2 uppercase tracking-tighter">
                              Week {(rider.totalWeeks || 0) + 1} Running
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className={`${
                            rider.isRecoveryBucket 
                            ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' 
                            : rider.paymentStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
                          } px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit`}>
                            {rider.isRecoveryBucket ? 'RECOVERY' : `${rider.totalWeeks || 0} WEEKS PAID`}
                          </span>
                          {rider.autoReminderEnabled && !rider.isRecoveryBucket && rider.paymentStatus === 'unpaid' && (
                            <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 ml-1">
                              <Loader2 size={8} className="animate-spin text-primary-500" /> 
                              SET FOR {rider.autoReminderTime}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleSendReminder(rider._id)}
                            disabled={sendingReminder === rider._id}
                            className="btn-secondary py-2 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group disabled:opacity-50"
                          >
                            {sendingReminder === rider._id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="group-hover:translate-x-0.5 transition-transform" />}
                            Remind
                          </button>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setOpenActionMenu(prev => prev === String(rider._id) ? null : String(rider._id))}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${openActionMenu === String(rider._id) ? 'bg-primary-500 text-black border-primary-500' : 'bg-slate-100 dark:bg-dark-200 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
                            >
                              Actions <ChevronDown size={14} className={`${openActionMenu === String(rider._id) ? 'rotate-180' : ''} transition-transform`} />
                            </button>

                            {openActionMenu === String(rider._id) && (
                              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-200/50">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Manage Rider</p>
                                </div>
                                <button onClick={() => { handlePayment(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <CreditCard size={16} className="text-primary-500" /> Create Payment Link
                                </button>
                                <button 
                                  onClick={() => { 
                                    if (rider.paymentStatus === 'unpaid') {
                                      setPaymentRider(rider);
                                      setPaymentData({ amount: rider.rentalRate || 2000, remarks: 'Manual Cash Payment' });
                                      setIsPaymentModalOpen(true);
                                    } else {
                                      handleUpdateStatus(rider._id, 'unpaid');
                                    }
                                    setOpenActionMenu(null); 
                                  }} 
                                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors"
                                >
                                  {rider.paymentStatus === 'paid' ? <XCircle size={16} className="text-orange-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />} 
                                  {rider.paymentStatus === 'paid' ? 'Mark as Unpaid' : 'Record Payment'}
                                </button>
                                <button onClick={() => { handleManualWhatsApp(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <MessageSquare size={16} className="text-emerald-500" /> Personal WhatsApp
                                </button>
                                <button onClick={() => { handleUpdateStatus(rider._id, { riderStatus: 'returned' }); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <RotateCcw size={16} className="text-blue-500" /> Mark as Returned
                                </button>
                                <button onClick={() => { setDamageRider(rider); setIsDamageModalOpen(true); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <Wrench size={16} className="text-red-500" /> Record Damage
                                </button>
                                <button onClick={() => { handleEditClick(rider); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <Edit2 size={16} className="text-slate-400" /> Edit Details
                                </button>
                                <Link to={`/app/riders/${rider._id}`} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                                  <ExternalLink size={16} className="text-slate-400" /> View History
                                </Link>
                                <button onClick={() => { handleDeleteRider(rider._id); setOpenActionMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                  <Trash2 size={16} /> Delete / Archive
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No riders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRiders.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Add/Edit Rider Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <div className="bg-white dark:bg-dark-100 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-slide-up shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="sticky top-0 bg-white/80 dark:bg-dark-100/80 backdrop-blur-md p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {isEditing ? 'UPDATE RIDER PROFILE' : 'RIDER REGISTRATION'}
              </h3>
              <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest mt-1">
                {isEditing ? `Modifying details for ${formData.name}` : 'Enrolling new workforce member'}
              </p>
            </div>
            <button 
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Rider Full Name</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  placeholder="Ex: John Doe" 
                  className="input h-12"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
                <input 
                  name="whatsappNumber"
                  type="tel" 
                  required
                  placeholder="+91 XXXXX XXXXX" 
                  className="input h-12"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Vehicle Number</label>
                <input 
                  name="vehicleNumber"
                  type="text" 
                  required
                  placeholder="KA-01-XX-XXXX" 
                  className="input h-12 uppercase"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Rider Status</label>
                <select 
                  name="riderStatus"
                  className="input h-12 appearance-none"
                  value={formData.riderStatus}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="recovery">Recovery</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Security Deposit (₹)</label>
                <input 
                  name="securityDeposit"
                  type="number" 
                  placeholder="Ex: 1000" 
                  className="input h-12"
                  value={formData.securityDeposit}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Weekly Rental Rate (₹)</label>
                <input 
                  name="rentalRate"
                  type="number" 
                  placeholder="Default: ₹2000" 
                  className="input h-12"
                  value={formData.rentalRate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-dark-200/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-black text-primary-600 dark:text-primary-500/70 uppercase tracking-widest ml-1">Deployment Date</label>
                <input 
                  name="deployDate"
                  type="date" 
                  className="input h-12 [color-scheme:light] dark:[color-scheme:dark]"
                  value={formData.deployDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>


            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-full btn-secondary h-14 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-primary h-14 shadow-glow-primary text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    {isEditing ? 'COMMIT UPDATES' : 'FINALIZE REGISTRATION'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Damage Record Modal */}
      <Modal 
        isOpen={isDamageModalOpen} 
        onClose={() => {
          setIsDamageModalOpen(false);
          setDamageData({ amount: '', reason: '' });
          setDamageRider(null);
        }}
      >
        <div className="bg-white dark:bg-dark-100 rounded-[2.5rem] w-full max-w-lg overflow-y-auto custom-scrollbar animate-slide-up shadow-2xl border border-red-500/20">
          <div className="sticky top-0 bg-red-500/5 dark:bg-red-500/10 backdrop-blur-md p-8 border-b border-red-500/10 flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl font-display font-black text-red-600 dark:text-red-400 uppercase tracking-tight flex items-center gap-2">
                <Wrench size={24} /> Record Damage
              </h3>
              <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mt-1">
                For Rider: {damageRider?.name} ({damageRider?.vehicleNumber})
              </p>
            </div>
            <button 
              onClick={() => {
                setIsDamageModalOpen(false);
                setDamageData({ amount: '', reason: '' });
                setDamageRider(null);
              }}
              className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-600 dark:text-red-500"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={submitDamage} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Damage Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Ex: 500" 
                  className="input h-14 text-xl font-black text-slate-900 dark:text-white"
                  value={damageData.amount}
                  onChange={(e) => setDamageData({...damageData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Reason for Charge</label>
                <textarea 
                  required
                  placeholder="Ex: Broken side mirror" 
                  className="input min-h-[100px] resize-none py-4"
                  value={damageData.reason}
                  onChange={(e) => setDamageData({...damageData, reason: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setIsDamageModalOpen(false);
                  setDamageData({ amount: '', reason: '' });
                  setDamageRider(null);
                }}
                className="w-full btn-secondary h-14 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-primary h-14 shadow-glow-primary bg-red-500 hover:bg-red-600 border-red-500 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    CHARGE RIDER
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
      {/* Manual Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentData({ amount: '', remarks: '' });
          setPaymentRider(null);
        }}
      >
        <div className="bg-white dark:bg-dark-100 rounded-[2.5rem] w-full max-w-lg overflow-y-auto custom-scrollbar animate-slide-up shadow-2xl border border-emerald-500/20">
          <div className="sticky top-0 bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-md p-8 border-b border-emerald-500/10 flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl font-display font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-2">
                <CreditCard size={24} /> Record Payment
              </h3>
              <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest mt-1">Manual collection for {paymentRider?.name}</p>
            </div>
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="p-2 hover:bg-emerald-500/10 rounded-xl transition-colors text-emerald-500"
            >
              <X size={24} />
            </button>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                await api.patch(`/riders/${paymentRider._id}/status`, {
                  paymentStatus: 'paid',
                  amount: Number(paymentData.amount),
                  remarks: paymentData.remarks
                });
                toast.success('Payment recorded successfully');
                setIsPaymentModalOpen(false);
                fetchRiders();
              } catch (err) {
                toast.error('Failed to record payment');
              } finally {
                setIsSubmitting(false);
              }
            }} 
            className="p-8 space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Collected Amount (₹)</label>
              <input 
                type="number" 
                required
                className="input h-14 text-lg"
                placeholder="2000"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Payment Remarks</label>
              <textarea 
                className="input min-h-[100px] py-4 resize-none"
                placeholder="e.g. Received cash via GPay / Cash hand over"
                value={paymentData.remarks}
                onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full btn-secondary h-14 font-bold rounded-2xl"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-primary h-14 bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-black font-black uppercase tracking-widest shadow-glow-emerald disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
