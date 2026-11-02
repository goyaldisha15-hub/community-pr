import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Heart, LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'volunteer': return '/volunteer';
      case 'participant': return '/participant';
      default: return '/login';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SevaConnect</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Home</Link>
            <Link to="/events" className={`text-sm font-medium transition-colors ${isActive('/events') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Events</Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to={getDashboardLink()} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button onClick={logout} className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Login</Link>
                <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fadeIn">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-primary">Home</Link>
            <Link to="/events" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-primary">Events</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-primary">Dashboard</Link>
                <button onClick={() => { logout(); setIsOpen(false); }} className="block text-sm font-medium text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-primary">Login</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="block bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium text-center">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
