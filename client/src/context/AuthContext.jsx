import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // credentials can be { email, password } or { whatsappNumber, password }
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const loginWithOtp = async (whatsappNumber, otp) => {
    const { data } = await api.post('/auth/verify-otp', { whatsappNumber, otp });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const forgotPassword = async (whatsappNumber) => {
    const { data } = await api.post('/auth/forgot-password', { whatsappNumber });
    return data;
  };

  const resetPassword = async (whatsappNumber, otp, newPassword) => {
    const { data } = await api.post('/auth/reset-password', { whatsappNumber, otp, newPassword });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithOtp, 
      forgotPassword, 
      resetPassword, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
