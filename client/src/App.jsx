import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Riders from './pages/Riders';
import RiderDetails from './pages/RiderDetails';
import Hala from './pages/Hala';
import Payments from './pages/Payments';
import Customer from './pages/Customer';
import Reports from './pages/Reports';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import Expenses from './pages/Expenses';
import LandingCMS from './pages/LandingCMS';
import WhatsAppCRM from './pages/WhatsAppCRM';
import ThankYou from './pages/ThankYou';
import Settings from './pages/Settings';



// Helper component for private routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

// Helper component for public routes
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return <Navigate to={user.role === 'employee' ? '/app/riders' : '/app/dashboard'} />;
};

// Block employees from admin-only routes
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'employee') return <Navigate to="/app/riders" replace />;
  return children;
};

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Helper component for idle timeout
const IdleTimer = ({ children }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 5 minutes for Rider (client number), 15 minutes for Admin
    const INACTIVITY_LIMIT = user.role === 'rider' ? 5 * 60 * 1000 : 15 * 60 * 1000;

    let timeout;

    const resetTimer = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
        toast('Session expired due to inactivity', { icon: '🔐' });
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <IdleTimer>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          
          {/* Private Dashboard Routes */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
             <Route index element={<Navigate to="/app/riders" replace />} />
             <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
             <Route path="riders" element={<Riders />} />
             <Route path="recovery" element={<Riders />} />
             <Route path="returns" element={<AdminRoute><Riders /></AdminRoute>} />
             <Route path="riders/:id" element={<RiderDetails />} />
             <Route path="hala" element={<AdminRoute><Hala /></AdminRoute>} />
             <Route path="payments" element={<AdminRoute><Payments /></AdminRoute>} />
             <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
             <Route path="customers" element={<AdminRoute><Customer /></AdminRoute>} />
             <Route path="expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
             <Route path="landing-cms" element={<AdminRoute><LandingCMS /></AdminRoute>} />
             <Route path="whatsapp-crm" element={<AdminRoute><WhatsAppCRM /></AdminRoute>} />
             <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </IdleTimer>
      </Router>
    </ThemeProvider>
  );
}

export default App;
