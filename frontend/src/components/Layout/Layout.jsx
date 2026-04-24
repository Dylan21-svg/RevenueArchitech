import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Store, FlaskConical, BarChart3, Settings, 
  ChevronLeft, ChevronRight, Zap, Bell, Search, LogOut, User
} from 'lucide-react';
import useStore from '../../store/useStore';
import wsService from '../../services/websocket';

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { currentStore, logout } = useStore();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/stores', icon: Store, label: 'Stores' },
    { path: '/ab-testing', icon: FlaskConical, label: 'A/B Testing' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg whitespace-nowrap"
              >
                RevenueArchitect
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Current Store Info */}
      {isOpen && currentStore && (
        <div className="mx-3 mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Active Store</p>
          <p className="font-medium text-sm truncate">{currentStore.shop_domain}</p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </motion.aside>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const Header = () => {
  const { currentStore, user } = useStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audits, stores..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{currentStore?.shop_domain || 'No store selected'}</p>
          </div>
          <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

const Layout = ({ children }) => {
  const { sidebarOpen, toggleSidebar, setFixProgress } = useStore();

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    wsService.connect();

    // Subscribe to fix progress updates
    wsService.onFixProgress((progress) => {
      setFixProgress(progress);
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div 
        className="transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 80 }}
      >
        <Header />
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;