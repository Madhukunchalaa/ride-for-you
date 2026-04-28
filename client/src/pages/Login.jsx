import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Eye, EyeOff, Zap, Phone } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const [loginMode, setLoginMode] = useState('otp'); // 'otp' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('7989776255');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back, Admin!');
      navigate('/dashboard'); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!whatsappNumber) return toast.error('Please enter your WhatsApp number');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { whatsappNumber });
      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');
    setLoading(true);
    try {
      await loginWithOtp(whatsappNumber, otp);
      toast.success('Login successful!');
      navigate('/dashboard'); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-600/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600/10 rounded-3xl mb-4 shadow-glow border border-primary-500/20">
            <Zap size={32} className="text-primary-400" />
          </div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight">Ride For You Admin</h1>
          <p className="text-slate-500 mt-2 font-medium">Sign in to manage your fleet</p>
        </div>

        <div className="bg-dark-100/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setLoginMode('otp')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${loginMode === 'otp' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              WhatsApp Login
            </button>
            <button
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${loginMode === 'admin' ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Admin Login
            </button>
          </div>

          {loginMode === 'otp' ? (
            <div className="space-y-6">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="label">WhatsApp Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                      <input 
                        type="text" 
                        className="input pl-12" 
                        placeholder="7989776255"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full py-4 text-base mt-4"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Request OTP'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="label">Enter OTP</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                      <input 
                        type="text" 
                        className="input pl-12 text-center tracking-widest text-lg font-mono" 
                        placeholder="••••••"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full py-4 text-base mt-4"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <LogIn size={20} className="inline mr-2" />
                        <span>Verify & Login</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full mt-4 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Change Number
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="label">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                  <input 
                    type="email" 
                    className="input pl-12" 
                    placeholder="admin@evride.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="input pl-12 pr-12" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-4 text-base mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <LogIn size={20} className="inline mr-2" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-600 italic">
              Secure area. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
