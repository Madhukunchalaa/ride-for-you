import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Eye, EyeOff, Zap, Phone, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA / OTP State
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [otp, setOtp] = useState('');

  // Forgot Password State
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const { login, loginWithOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return toast.error('Please enter details');
    setLoading(true);
    try {
      const res = await login({ identifier, password });
      if (res.otp_required) {
        setWhatsappNumber(res.whatsappNumber);
        setStep(2);
        toast.success('Credentials verified. Please enter OTP.');
      } else {
        toast.success('Welcome back!');
        navigate('/app/dashboard'); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');
    setLoading(true);
    try {
      if (forgotPasswordMode) {
        await resetPassword(whatsappNumber, otp, newPassword);
        toast.success('Password reset successful! You can now login.');
        setForgotPasswordMode(false);
        setStep(1);
        setOtp('');
      } else {
        await loginWithOtp(whatsappNumber, otp);
        toast.success('Login successful!');
        navigate('/app/dashboard'); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error('Please enter your registered email');
    setLoading(true);
    try {
      // Forgot password still uses email in the backend for now, but we can pass identifier
      const res = await forgotPassword(identifier);
      setWhatsappNumber(res.data.whatsappNumber);
      setStep(2); // Move to OTP verification
      toast.success('Reset OTP sent to your WhatsApp!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setForgotPasswordMode(false);
    setOtp('');
    setPassword('');
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
          <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase italic">Ride For You</h1>
          <p className="text-slate-500 mt-2 font-black uppercase tracking-[0.2em] text-[10px]">
            {forgotPasswordMode ? 'Security Recovery Protocol' : 'Authorized Access Point'}
          </p>
        </div>

        <div className="bg-dark-100/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative">
          
          {step === 2 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-4 py-1 rounded-full shadow-lg flex items-center gap-2">
              <CheckCircle2 size={12} />
              STEP 2: WHATSAPP VERIFICATION
            </div>
          )}

          {forgotPasswordMode && step === 1 ? (
             <form onSubmit={handleForgotPasswordRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registered Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                    <input 
                      type="email" 
                      className="input pl-12" 
                      placeholder="rider@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <button type="button" onClick={resetFlow} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-base">
                    {loading ? 'Processing...' : 'Send Reset OTP'}
                  </button>
                </div>
             </form>
          ) : step === 1 ? (
            <form onSubmit={handleInitialLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number / Email</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                  <input 
                    type="text" 
                    className="input pl-12" 
                    placeholder="Enter phone or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
                  <button 
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-[10px] font-black text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest"
                  >
                    Forgot?
                  </button>
                </div>
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
                className="btn-primary w-full py-5 text-base mt-4 font-black uppercase tracking-widest shadow-glow-primary"
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
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-black">Verification Code Sent To</p>
                <p className="text-sm font-bold text-white tracking-widest font-mono">XXXXXX{whatsappNumber.slice(-4)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enter OTP</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                  <input 
                    type="text" 
                    className="input pl-12 text-center tracking-[0.5em] text-lg font-mono" 
                    placeholder="••••••"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              {forgotPasswordMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="input pl-12 pr-12" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button type="button" onClick={resetFlow} className="p-4 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-5 text-base font-black uppercase tracking-widest shadow-glow-primary">
                  {loading ? 'Verifying...' : forgotPasswordMode ? 'Reset Password' : 'Verify & Login'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black">
              {forgotPasswordMode ? 'Security Recovery Protocol Active' : 'Secure area. Authorized access only.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
