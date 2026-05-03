import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, Close as CloseIcon, Home as HomeIcon } from '@mui/icons-material';
import { logout } from '../../redux/slices/authSlice';
import { getAvatarSrc } from '../../utils/imageUrl';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const navigationLinks = [
    { title: 'Properties', path: '/properties' },
    ...(isAuthenticated && (user?.role === 'seller' || user?.role === 'admin')
      ? [{ title: 'Add Property', path: '/properties/add' }]
      : []),
    ...(isAuthenticated
      ? [{ title: 'Transactions', path: '/transactions' }]
      : []),
    ...(isAuthenticated && user?.role === 'admin'
      ? [{ title: 'Admin', path: '/admin' }]
      : [])
  ];

  const userMenuItems = isAuthenticated
    ? [
        { title: 'Dashboard', path: '/dashboard' },
        { title: 'Profile', path: '/profile' },
        ...(user?.role === 'admin' ? [{ title: 'Admin Dashboard', path: '/admin' }] : []),
        { title: 'Logout', onClick: handleLogout }
      ]
    : [
        { title: 'Login', path: '/login' },
        { title: 'Register', path: '/register' }
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <RouterLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <HomeIcon className="text-primary-600" style={{ fontSize: 28 }} />
            <span className="text-lg font-bold text-gray-900 hidden sm:block">Real Estate</span>
          </RouterLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navigationLinks.map(link => (
              <RouterLink
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {link.title}
              </RouterLink>
            ))}
          </div>

          {/* Right side: avatar + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="User menu"
              >
                <img
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-200"
                  src={getAvatarSrc(user?.profileImage)}
                  alt={user?.name || 'User'}
                />
                {isAuthenticated && (
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  {isAuthenticated && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  )}
                  {userMenuItems.map(item => (
                    <button
                      key={item.title}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        item.title === 'Logout'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          navigate(item.path);
                          setUserMenuOpen(false);
                        }
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navigationLinks.map(link => (
              <RouterLink
                key={link.path}
                to={link.path}
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.title}
              </RouterLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
