import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuToggle}
              aria-label="Open sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo - visible on mobile */}
            <div className="flex-shrink-0 flex items-center lg:hidden ml-2">
              <Link to="/" className="text-primary-500 font-bold text-xl">
                WayrApp
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden lg:ml-6 lg:flex lg:space-x-8">
              <Link
                to="/dashboard"
                className="border-transparent text-neutral-500 hover:border-primary-500 hover:text-primary-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('common.navigation.dashboard')}
              </Link>
              <Link
                to="/courses"
                className="border-transparent text-neutral-500 hover:border-primary-500 hover:text-primary-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('common.navigation.courses')}
              </Link>
              <Link
                to="/lessons"
                className="border-transparent text-neutral-500 hover:border-primary-500 hover:text-primary-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('common.navigation.lessons')}
              </Link>
              <Link
                to="/exercises"
                className="border-transparent text-neutral-500 hover:border-primary-500 hover:text-primary-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('common.navigation.exercises')}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <LanguageSelector />
            
            {/* User profile dropdown */}
            <div className="relative" ref={menuRef}>
              <div>
                <button
                  type="button"
                  className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  id="user-menu-button"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                    {getUserInitials()}
                  </div>
                </button>
              </div>
              
              {/* User dropdown menu */}
              {isMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <div className="px-4 py-2 text-sm text-neutral-700 border-b border-neutral-200">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-neutral-500">{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('common.navigation.profile')}
                  </Link>
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={handleLogout}
                  >
                    {t('common.navigation.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;