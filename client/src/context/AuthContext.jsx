import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      let isExpired = false;
      
      if (parsedUser.role === 'rider') {
        const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutes for Riders
        if (lastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
          if (timeSinceLastActivity > INACTIVITY_LIMIT) {
            isExpired = true;
          }
        } else {
          isExpired = true;
        }
      }
      
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        setUser(null);
        toast('Session expired due to inactivity', { icon: '🔐' });
      } else {
        setUser(parsedUser);
        localStorage.setItem('lastActivity', Date.now().toString());
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.otp_required) {
      return data; // Return to trigger Step 2 in UI
    }
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('lastActivity', Date.now().toString());
      setUser(data.user);
    }
    return data;
  };

  const loginWithOtp = async (whatsappNumber, otp) => {
    const { data } = await api.post('/auth/verify-otp', { whatsappNumber, otp });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('lastActivity', Date.now().toString());
      setUser(data.user);
    }
    return data;
  };

  const forgotPassword = async (identifier) => {
    return await api.post('/auth/forgot-password', { identifier });
  };

  const resetPassword = async (whatsappNumber, otp, newPassword) => {
    return await api.post('/auth/reset-password', { whatsappNumber, otp, newPassword });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithOtp, forgotPassword, resetPassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
