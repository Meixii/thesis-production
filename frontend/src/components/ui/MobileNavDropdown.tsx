import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactElement;
}

interface MobileNavDropdownProps {
  label: string;
  icon: React.ReactElement;
  items: NavItem[];
  isActive: (path: string) => boolean;
}

const MobileNavDropdown: React.FC<MobileNavDropdownProps> = ({ label, icon, items, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const anyActive = items.some(item => isActive(item.href));

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          anyActive
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
            : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
        } w-full flex items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
      >
        <div className="flex items-center">
          <span className="mr-3">{icon}</span>
          <span>{label}</span>
        </div>
        <svg 
          className={`w-4 h-4 mr-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="pl-10 space-y-1">
          {items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center transition-colors`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileNavDropdown; 