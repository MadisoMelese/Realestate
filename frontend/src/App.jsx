import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { getCurrentUser } from './redux/slices/authSlice';
// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page components
import Home from './pages/Home';
import PropertyList from './pages/PropertyList';
import PropertyDetails from './pages/PropertyDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Transactions from './pages/Transactions';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route component — redirects to /login if not authenticated
const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Still restoring session — don't redirect yet
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route component — redirects to /dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists — restore the session before rendering protected routes
      dispatch(getCurrentUser()).finally(() => setAuthInitialized(true));
    } else {
      setAuthInitialized(true);
    }
  }, [dispatch]);

  if (!authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/add"
            element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/edit/:id"
            element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <EditProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />

          {/* Admin route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
