import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: t('common.navigation.dashboard'), icon: '📊' },
    { path: '/courses', label: t('common.navigation.courses'), icon: '📚' },
    { path: '/lessons', label: t('common.navigation.lessons'), icon: '📝' },
    { path: '/exercises', label: t('common.navigation.exercises'), icon: '🏋️' },
  ];

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
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900 bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and close button */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="text-primary-500 font-bold text-xl">WayrApp Creator</div>
          <button 
            className="lg:hidden text-neutral-500 hover:text-neutral-700"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              {getUserInitials()}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-neutral-500">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`
                  }
                  onClick={onClose}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;