import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationProps {
  items: NavigationItem[];
  userRole?: 'student' | 'finance_coordinator';
}

const Navigation: React.FC<NavigationProps> = ({ items, userRole = 'student' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background-primary dark:bg-neutral-800 shadow-soft border-b border-neutral-200 dark:border-neutral-700">
      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {items.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    inline-flex items-center px-3 pt-1 text-sm font-medium
                    transition-colors duration-200
                    ${isActive(item.href)
                      ? 'border-b-2 border-primary-500 text-text-primary dark:text-white bg-primary-50/50 dark:bg-primary-900/20'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-700/50'
                    }
                  `}
                >
                  <item.icon 
                    className={`h-5 w-5 mr-2 transition-colors duration-200
                      ${isActive(item.href) 
                        ? 'text-primary-500 dark:text-primary-400' 
                        : 'text-neutral-400 group-hover:text-primary-500 dark:text-neutral-500 dark:group-hover:text-primary-400'
                      }`
                    } 
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-text-tertiary
                hover:text-text-primary hover:bg-neutral-100 
                dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-700
                transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-neutral-200 dark:border-neutral-700">
          <div className="pt-2 pb-3 space-y-1">
            {items.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-2 text-base font-medium
                  transition-colors duration-200
                  ${isActive(item.href)
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-text-secondary hover:bg-neutral-50 hover:border-l-4 hover:border-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:border-neutral-600'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon 
                  className={`h-5 w-5 mr-3 transition-colors duration-200
                    ${isActive(item.href) 
                      ? 'text-primary-500 dark:text-primary-400' 
                      : 'text-neutral-400 group-hover:text-primary-500 dark:text-neutral-500 dark:group-hover:text-primary-400'
                    }`
                  } 
                />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation; 