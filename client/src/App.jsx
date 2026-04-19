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
import LandingPage from './pages/LandingPage';

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
  return !user ? children : <Navigate to="/app/dashboard" />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* Private Dashboard Routes */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
             <Route index element={<Navigate to="/app/dashboard" replace />} />
             <Route path="dashboard" element={<Dashboard />} />
             <Route path="riders" element={<Riders />} />
             <Route path="riders/:id" element={<RiderDetails />} />
             <Route path="hala" element={<Hala />} />
             <Route path="payments" element={<Payments />} />
             <Route path="customers" element={<Customer />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
