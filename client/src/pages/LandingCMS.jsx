import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Monitor, 
  Image as ImageIcon,
  Save,
  X,
  Layout
} from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function LandingCMS() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    rental: '',
    platformFee: '',
    bookingFee: '200',
    total: '',
    image: '/assets/storm.png',
    order: 0
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/landing/plans');
      setPlans(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/landing/plans/${editingId}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/landing/plans', formData);
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      rental: plan.rental,
      platformFee: plan.platformFee,
      bookingFee: plan.bookingFee,
      total: plan.total,
      image: plan.image,
      order: plan.order || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this pricing card?')) {
      try {
        await api.delete(`/landing/plans/${id}`);
        fetchPlans();
        toast.success('Plan removed');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      rental: '',
      platformFee: '',
      bookingFee: '200',
      total: '',
      image: '/assets/storm.png',
      order: plans.length
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">Landing Page CMS</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
            <Monitor size={16} className="text-primary-500" /> Manage Dynamic Frontend Content
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-glow-primary font-black uppercase text-xs tracking-widest"
        >
          <Plus size={18} /> Add New Plan
        </button>
      </div>

      {/* Grid View of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-white dark:bg-dark-100/40 rounded-[2rem] border border-slate-200 dark:border-slate-800">
             <Loader2 size={32} className="text-primary-500 animate-spin" />
             <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing with Frontend...</span>
          </div>
        ) : plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan._id} className="group relative bg-white dark:bg-dark-100/60 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl transition-all duration-500">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{plan.name}</h4>
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">Order Index: {plan.order}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(plan)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-dark-200 text-slate-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(plan._id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-dark-200 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>

               <div className="aspect-video bg-slate-100 dark:bg-dark-200 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                  <img src={plan.image} alt={plan.name} className="w-full h-full object-cover opacity-80" />
               </div>

               <div className="space-y-3 bg-slate-50 dark:bg-dark-200/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Weekly Rental</span>
                    <span className="text-slate-900 dark:text-white">₹{plan.rental}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Platform Fee</span>
                    <span className="text-slate-900 dark:text-white">₹{plan.platformFee}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span className="text-primary-500 uppercase">Total Due Today</span>
                    <span className="text-primary-500 font-black">₹{plan.total}</span>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-dark-200/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
             <Layout className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
             <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No active pricing cards on landing page</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Pricing Card" : "New Pricing Card"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Card Title / EV Name</label>
              <input 
                name="name"
                required
                placeholder="e.g. Brand New EV" 
                className="input h-12"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Display Image Path</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  name="image"
                  className="input h-12 pl-10 appearance-none"
                  value={formData.image}
                  onChange={handleInputChange}
                >
                  <option value="/assets/storm.png">Storm (Blue Scooter)</option>
                  <option value="/assets/fusion.png">Fusion (White Scooter)</option>
                  <option value="/assets/atlas.png">Atlas (Cargo EV)</option>
                  <option value="/assets/hero.png">Hero (Generic)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Weekly Rental (₹)</label>
              <input 
                name="rental"
                required
                placeholder="1,920" 
                className="input h-12"
                value={formData.rental}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Platform Fee (₹)</label>
              <input 
                name="platformFee"
                required
                placeholder="1,500" 
                className="input h-12"
                value={formData.platformFee}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Total Display Amount (₹)</label>
              <input 
                name="total"
                required
                placeholder="3,620" 
                className="input h-12 border-primary-500/30 focus:border-primary-500"
                value={formData.total}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Booking Fee (₹) - Hidden</label>
              <input 
                name="bookingFee"
                required
                className="input h-12 opacity-60"
                value={formData.bookingFee}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Display Order (0-10)</label>
              <input 
                name="order"
                type="number"
                required
                className="input h-12"
                value={formData.order}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-secondary h-14 bg-slate-100 dark:bg-dark-200 text-slate-500 font-bold rounded-2xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] btn-primary h-14 shadow-glow-primary rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{editingId ? "Update Dynamic Card" : "Push to Live Site"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
