import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Plus, Search, Filter, Phone, Calendar, Car, ShieldCheck, X, Loader2, MoreVertical, ExternalLink, Send, CreditCard, CheckCircle2, Trash2, Edit2, RotateCcw, FilterX } from 'lucide-react';

import api from '../api/axios';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const location = useLocation();
  const isRecoveryPage = location.pathname.includes('/recovery');
  const isReturnsPage = location.pathname.includes('/returns');


  useEffect(() => {
    if (isRecoveryPage) {
      setActiveTab('recovery');
    } else if (isReturnsPage) {
      setActiveTab('returned');
    } else {
      setActiveTab('active');
    }
  }, [isRecoveryPage, isReturnsPage]);


  // --- Cashfree Payment Logic ---
  const handlePayment = async (rider) => {
    try {
      toast.loading("Generating Cashfree Link...", { id: "cf-link" });
      const amount = rider.whatsappNumber === '7095682464' ? 1 : 2000;
      const { data } = await api.post('/payments/create-link', {
        riderId: rider._id,
        amount: amount
      });

      if (data.success && data.url) {
        toast.dismiss("cf-link");
        // Open the generated Payment Link in a new tab or same tab
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast.dismiss("cf-link");
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

  const handleUpdateStatus = async (riderId, status) => {
    try {
      await api.patch(`/riders/${riderId}/status`, { paymentStatus: status });
      toast.success(`Rider marked as ${status}`);
      fetchRiders();
    } catch (err) {
      toast.error('Failed to update status');
    }
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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    riderStatus: 'active',
    vehicleNumber: '',
    deployDate: '',
    returnDate: '',
    autoReminderEnabled: true,
    autoReminderTime: '10:00'
  });

  // Fetch Riders
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

    // LIVE SYNC: Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchRiders(false); // Fetch silently in background
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle Deploy Date Change (Update Return Date)
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
      autoReminderTime: '10:00'
    });
  };

  const handleEditClick = (rider) => {
    setIsEditing(true);
    setEditId(rider._id);
    setFormData({
      name: rider.name || '',
      whatsappNumber: rider.whatsappNumber || '',
      riderStatus: rider.riderStatus || 'active',
      vehicleNumber: rider.vehicleNumber || '',
      deployDate: rider.deployDate ? new Date(rider.deployDate).toISOString().split('T')[0] : '',
      returnDate: rider.returnDate ? new Date(rider.returnDate).toISOString().split('T')[0] : '',
      autoReminderEnabled: rider.autoReminderEnabled ?? true,
      autoReminderTime: rider.autoReminderTime || '10:00'
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
      isCorrectTab = rider.isRecoveryBucket === true && rider.riderStatus !== 'returned';
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
    return isCorrectTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

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
      </div>

      {/* Controls */}
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
          <button 
            onClick={() => setActiveTab('inactive')} 
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'inactive' ? 'bg-white dark:bg-slate-800 shadow-md text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Past Riders
          </button>
        </div>
      )}


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
              <FilterX size={18} />
            </button>
          )}
        </div>
        <button 
          onClick={() => {
            if (searchTerm) setSearchTerm('');
            else toast('Use the search box to filter results', { icon: '🔍' });
          }}
          className="h-14 bg-white dark:bg-dark-200/50 border border-slate-300 dark:border-slate-800/50 rounded-2xl flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:text-primary-600 dark:hover:text-white shadow-sm"
        >
          <Filter size={18} /> Filters
        </button>

      </div>

      {/* Content - Adaptive View */}
      <div className="space-y-4 md:space-y-0">
        {/* Mobile Card View (Visible only on small screens) */}
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
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Status</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${rider.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {rider.paymentStatus || 'unpaid'}
                      </span>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSendReminder(rider._id)}
                    disabled={sendingReminder === rider._id}
                    className="flex-1 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {sendingReminder === rider._id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">Remind</span>
                  </button>
                  <button 
                    onClick={() => handlePayment(rider)}
                    className="flex-1 h-12 bg-primary-500/10 text-primary-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <CreditCard size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pay</span>
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('Mark this vehicle as returned? This will end the active rental.')) {
                        handleUpdateStatus(rider._id, 'returned');
                      }
                    }}
                    className="h-12 w-12 bg-orange-500/10 text-orange-600 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                    title="Mark as Returned"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button 
                    onClick={() => handleEditClick(rider)}

                    className="h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  >
                    <Edit2 size={18} />
                  </button>
                  <Link 
                    to={`/app/riders/${rider._id}`}
                    className="h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
             <div className="py-12 bg-white dark:bg-dark-100/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Riders Found</div>
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block bg-white dark:bg-dark-100/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-dark-200/30">
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Rider Details</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Vehicle No.</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Deploy Date</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Return Date</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Payment</th>
                  <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-[0.2em] text-center">Actions</th>
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
                          <div className="w-12 h-12 rounded-2xl bg-primary-600/10 dark:bg-primary-600/5 border border-primary-500/20 flex items-center justify-center text-primary-500 dark:text-primary-400">
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
                        <span className="text-sm font-mono text-primary-600 dark:text-primary-300 font-black bg-primary-500/5 px-3 py-1.5 rounded-xl border border-primary-500/10">
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
                        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-300 font-black bg-primary-500/10 w-fit px-3 py-1 rounded-lg">
                          <Calendar size={14} className="text-primary-500" />
                          {formatDate(rider.returnDate)}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          rider.riderStatus === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : rider.riderStatus === 'returned'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'

                        }`}>
                          {rider.riderStatus}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className={`${
                            rider.isRecoveryBucket 
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                            : rider.paymentStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                          } px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit`}>
                            {rider.isRecoveryBucket ? 'RECOVERY' : (rider.paymentStatus || 'unpaid')}
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
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleSendReminder(rider._id)}
                            disabled={sendingReminder === rider._id}
                            className="p-2.5 hover:bg-emerald-500/10 rounded-xl text-emerald-500 hover:text-emerald-600 transition-all disabled:opacity-50"
                            title="Send WhatsApp Reminder"
                          >
                            {sendingReminder === rider._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} />
                            )}
                          </button>
                          <button 
                            onClick={() => handlePayment(rider)}
                            className="p-2.5 hover:bg-emerald-500/10 rounded-xl text-emerald-500 hover:text-emerald-600 transition-all"
                            title="Test Cashfree Payment"
                          >
                            <CreditCard size={18} />
                          </button>
                          <Link 
                            to={`/app/riders/${rider._id}`}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary-500 transition-all"
                            title="View Full Details"
                          >
                            <ExternalLink size={18} />
                          </Link>
                          <button 
                            onClick={() => {
                              if(confirm('Mark this vehicle as returned? This will end the active rental.')) {
                                handleUpdateStatus(rider._id, 'returned');
                              }
                            }}
                            className="p-2.5 hover:bg-orange-500/10 rounded-xl text-orange-500 hover:text-orange-600 transition-all"
                            title="Mark as Returned"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(rider)}

                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary-500 transition-all"
                            title="Edit Rider"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRider(rider._id)}
                            className="p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                            title="Delete Rider"
                          >
                            <Trash2 size={18} />
                          </button>
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
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-dark-200/50 rounded-2xl border border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-black text-primary-500/70 uppercase tracking-widest ml-1">Deployment Date</label>
                <input 
                  name="deployDate"
                  type="date" 
                  className="input h-12 [color-scheme:dark]"
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
                className="w-full btn-secondary h-14 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
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
    </div>
  );
}
