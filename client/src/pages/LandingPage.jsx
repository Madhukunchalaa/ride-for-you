import { useState, useEffect } from "react";
import api from "../api/axios";
import { 
  Zap, 
  ChevronRight, 
  Phone, 
  Mail, 
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  MapPin
} from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Jeedimetla',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShowCookieBanner(true), 2000);
    }
  }, []);

  const handleCookieAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowCookieBanner(false);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/landing/plans');
        setPlans(res.data.data);
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/customers', formData);
      if (response.data.success) {
        setShowSuccessModal(true);
        setFormData({ name: '', email: '', phone: '', city: 'Jeedimetla', message: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to submit. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-primary-500/30 font-sans">
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm transition-opacity" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-slate-900 border border-primary-500/30 p-10 rounded-[2rem] max-w-md w-full shadow-[0_0_50px_rgba(20,184,166,0.15)] text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-primary-500/10 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-primary-500/20">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <h3 className="text-3xl font-black font-display mb-4 text-white tracking-tight">Request Received!</h3>
            <p className="text-slate-400 font-medium mb-8 leading-relaxed text-lg">
              Thank you for choosing <span className="text-primary-400">Ride For You EV</span>. Our coordinator will contact you shortly in a professional way to finalize your fleet.
            </p>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-primary-400 transition-all active:scale-[0.98] shadow-lg"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase font-display">
              Ride <span className="text-primary-400">For You</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-10 font-bold text-sm uppercase tracking-widest text-slate-400">
            <a href="#about" className="hover:text-primary-400 transition-colors">About</a>
            <a href="#fleet" className="hover:text-primary-400 transition-colors">Fleet</a>
            <a href="#locations" className="hover:text-primary-400 transition-colors">Locations</a>
            <a href="#contact" className="bg-white text-black px-8 py-3 rounded-full hover:bg-primary-400 hover:text-black transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]">Get Started</a>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-700/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-primary-400 font-bold text-xs uppercase tracking-[0.2em]">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-ping" />
                Pure Electric Fleet
              </div>
              <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter font-display text-white">
                FUTURE <br/>OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">URBAN</span> <br/>MOBILITY.
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
                High-performance electric vehicles designed for the modern hustle. No noise, zero emissions, just pure electric power.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <a href="#contact" className="flex items-center justify-center gap-3 bg-primary-500 hover:bg-primary-400 text-black font-black uppercase tracking-tighter text-lg px-10 py-5 rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-95">
                  Book Your Ride <ChevronRight size={20} />
                </a>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                  <div className="flex -space-x-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800" />
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-white">2,500+</div>
                    <div className="text-slate-400 font-medium whitespace-nowrap">Eco-Trips</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                <img 
                  src="/assets/hero.png" 
                  alt="Future EV" 
                  className="w-full grayscale hover:grayscale-0 transition-all duration-700 object-cover aspect-[4/3] lg:aspect-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-y border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active EV Fleet', value: '450+' },
              { label: 'Key Hubs', value: '5' },
              { label: 'CO2 Saved', value: '18 Tons' },
              { label: 'Rating', value: '4.9/5' }
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black text-white mb-1 tracking-tighter font-display">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Section */}
      <section id="fleet" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-sm font-bold text-primary-500 uppercase tracking-[0.3em] mb-4">The Collection</h2>
              <h3 className="text-4xl lg:text-5xl font-black tracking-tighter font-display text-white">ELITE EV FLEET.</h3>
            </div>
            <p className="text-slate-400 max-w-sm font-medium">Precision engineered battery tech for reliability and long-range performance.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {plans.length > 0 ? (
              plans.map((ev, i) => (
                <div key={i} className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition-all duration-500 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-2xl font-black tracking-tighter font-display text-white">{ev.name}</h4>
                      <p className="text-primary-500 font-bold tracking-widest uppercase mt-1 text-[10px]">Unlimited Swapping</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all flex-shrink-0">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  
                  <div className="aspect-[4/3] bg-slate-900 border border-white/5 rounded-3xl overflow-hidden mb-8 relative flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-10 opacity-80"></div>
                    <img src={ev.image} alt={ev.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Weekly Rental <span className="text-[9px] uppercase tracking-widest text-slate-500 block mt-0.5">7 Days</span></span>
                        <span className="text-white font-bold">₹{ev.rental}</span>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Platform Fee <span className="text-[9px] uppercase tracking-widest text-slate-500 block mt-0.5 border border-slate-700 rounded p-0.5 w-fit">Non-Refundable</span></span>
                        <span className="text-white font-bold">₹{ev.platformFee}</span>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-400">Booking Fee <span className="text-[9px] uppercase tracking-widest text-slate-500 block mt-0.5 border border-slate-700 rounded p-0.5 w-fit">Non-Refundable</span></span>
                        <span className="text-white font-bold">₹{ev.bookingFee || '200'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-primary-500/10 border border-primary-500/20 p-6 rounded-3xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-primary-400 font-black block">Total Amount</span>
                        <span className="text-xs text-primary-500/60 font-bold">Due Today</span>
                      </div>
                      <span className="text-3xl font-black tracking-tighter text-white">₹{ev.total}/-</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback cards while loading or if empty
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 animate-pulse">
                  <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
                  <div className="aspect-video bg-white/5 rounded-2xl mb-8" />
                  <div className="space-y-4">
                    <div className="h-12 bg-white/5 rounded-2xl" />
                    <div className="h-16 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section id="contact" className="py-32 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-800/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[4rem] border border-white/10 p-12 lg:p-20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-white/5 uppercase font-black text-8xl font-display pointer-events-none select-none">
              JOIN
            </div>

            <div className="grid lg:grid-cols-2 gap-20 relative z-10">
              <div className="space-y-12">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-6 font-display text-white">READY TO <br/><span className="text-primary-400">UPGRADE?</span></h2>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Fill out the form and our EV fleet managers will secure your vehicle.</p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Phone className="text-black" />
                    </div>
                    <div>
                      <h5 className="text-sm uppercase tracking-widest text-slate-500 font-black mb-1">Call Support</h5>
                      <p className="text-xl font-bold text-white">+91 7989776255</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                      <Mail className="text-black" />
                    </div>
                    <div>
                      <h5 className="text-sm uppercase tracking-widest text-slate-500 font-black mb-1">Official Inquiry</h5>
                      <p className="text-xl font-bold text-white">rideforyouev@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {status.message && status.type === 'error' && (
                    <div className="p-5 rounded-2xl font-bold text-sm uppercase tracking-widest bg-white/5 border text-red-400 border-red-500/20">
                      {status.message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                    <input 
                      type="text" name="name" required value={formData.name} onChange={handleChange}
                      placeholder="e.g. Rahul Sharma" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary-500 transition-all font-bold placeholder:text-slate-700 text-white" 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Phone</label>
                      <input 
                        type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                        placeholder="+91..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary-500 transition-all font-bold placeholder:text-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Hub Location</label>
                      <select 
                        name="city" value={formData.city} onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary-500 transition-all font-bold appearance-none cursor-pointer text-white"
                      >
                        <option className="bg-slate-900 border-none px-4 py-2 hover:bg-primary-500">Jeedimetla</option>
                        <option className="bg-slate-900 border-none px-4 py-2 hover:bg-primary-500">Uppal</option>
                        <option className="bg-slate-900 border-none px-4 py-2 hover:bg-primary-500">Secunderabad</option>
                        <option className="bg-slate-900 border-none px-4 py-2 hover:bg-primary-500">Gandimaisamma</option>
                        <option className="bg-slate-900 border-none px-4 py-2 hover:bg-primary-500">Jubilee Hills</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                    <input 
                      type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder="name@company.com" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary-500 transition-all font-bold placeholder:text-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Specific Requirements</label>
                    <textarea 
                      name="message" rows="2" value={formData.message} onChange={handleChange}
                      placeholder="Rental duration, volume requirements..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary-500 transition-all font-bold placeholder:text-slate-700 text-white resize-none"
                    ></textarea>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-white text-black font-black uppercase tracking-widest py-6 rounded-2xl mt-4 hover:bg-primary-400 hover:text-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
                  >
                    {loading ? 'Processing Protocol...' : 'Confirm Registration'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-primary-500 fill-primary-500" size={28} />
                <span className="font-black tracking-tighter uppercase text-2xl font-display text-white">Ride For You EV</span>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Leading the shift to sustainable urban mobility with high-performance electric vehicles.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white mb-6">Compliance</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><Link to="/terms-and-conditions" className="hover:text-primary-400 transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-primary-400 transition-colors">Refund & Cancellation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white mb-6">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li className="flex items-center gap-2"><Mail size={14} className="text-primary-500" /> rideforyouev@gmail.com</li>
                <li className="flex items-center gap-2"><Phone size={14} className="text-primary-500" /> +91 7989776255</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white mb-6">Location</h4>
              <div className="flex items-start gap-2 text-sm font-bold text-slate-500">
                <MapPin size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
                <p>Plot No. 12, Phase 1, Jeedimetla Industrial Area, Hyderabad, Telangana 500055</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Ownership & Management</h4>
              <p className="font-bold text-white text-sm">Pasireddy Balram Kumar <span className="text-slate-500 mx-2">|</span> <span className="text-primary-400 font-medium">Founder, YS Manpower Solutions</span></p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border border-slate-800 px-2 py-0.5 rounded">GST: [Enter GST Number]</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border border-slate-800 px-2 py-0.5 rounded">MSME Registered</span>
              </div>
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 Ride For You EV. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-8 left-8 right-8 z-[100] animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-400 flex-shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  We use cookies to enhance your experience and analyze our traffic. By clicking <span className="text-white font-bold">"Accept All"</span>, you consent to our use of cookies in accordance with our <Link to="/privacy-policy" className="text-primary-400 underline underline-offset-4 decoration-primary-500/30 hover:decoration-primary-500 transition-all">Privacy Policy</Link>.
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={() => setShowCookieBanner(false)}
                  className="flex-1 md:flex-none px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                >
                  Decline
                </button>
                <button 
                  onClick={handleCookieAccept}
                  className="flex-1 md:flex-none px-10 py-4 bg-primary-500 hover:bg-primary-400 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
