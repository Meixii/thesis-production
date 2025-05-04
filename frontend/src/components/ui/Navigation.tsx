import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';

interface NavigationItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
  roles?: Array<'student' | 'finance_coordinator'>;
}

interface NavigationProps {
  userRole?: 'student' | 'finance_coordinator';
  onLogout?: () => void;
}

// Default navigation items for the application
const defaultNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard', // This will be adjusted dynamically based on role
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    roles: ['student', 'finance_coordinator']
  },
  {
    name: 'Payments',
    href: '/payment',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      </svg>
    ),
    roles: ['student']
  },
  {
    name: 'Verify Payments',
    href: '/verify-payments',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4" />
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
    name: 'My Loans',
    href: '/loans/my-loans',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      </svg>
    ),
    roles: ['student']
  },
  {
    name: 'Loan Requests',
    href: '/loans/intra',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
    name: 'Members',
    href: '/members',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
    name: 'Expenses',
    href: '/expenses',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: (props) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={props.className}
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      </svg>
    ),
    roles: ['student', 'finance_coordinator']
  }
];

const Navigation: React.FC<NavigationProps> = ({ 
  userRole = 'student', 
  onLogout 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<'student' | 'finance_coordinator'>(userRole);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If userRole prop is provided, use it
    if (userRole) {
      setCurrentRole(userRole);
      return;
    }

    // Otherwise try to determine the user's role from the current route or API
    if (location.pathname.includes('/dashboard/fc')) {
      setCurrentRole('finance_coordinator');
    } else if (location.pathname.includes('/dashboard/student')) {
      setCurrentRole('student');
    } else {
      // Try to fetch user data to determine role
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          const response = await fetch(getApiUrl('/api/auth/profile'), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          if (response.ok && data.data?.role) {
            const role = data.data.role.toLowerCase();
            setCurrentRole(role === 'finance_coordinator' ? 'finance_coordinator' : 'student');
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
      };

      fetchUserData();
    }
  }, [location.pathname, userRole]);

  // Adjust dashboard route based on role
  const processedItems = defaultNavigationItems.map(item => {
    if (item.name === 'Dashboard') {
      return {
        ...item,
        href: currentRole === 'finance_coordinator' ? '/dashboard/fc' : '/dashboard/student'
      };
    }
    return item;
  });

  // Filter navigation items based on user role
  const filteredItems = processedItems.filter(
    item => !item.roles || item.roles.includes(currentRole)
  );

  const isActive = (path: string) => {
    // Handle special case for dashboard
    if (path === '/dashboard/fc' && location.pathname === '/dashboard/fc') return true;
    if (path === '/dashboard/student' && location.pathname === '/dashboard/student') return true;
    
    // General case
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Thesis Finance
            </h1>
            <div className="hidden md:ml-10 md:flex md:space-x-6">
              {filteredItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon 
                    className={`h-5 w-5 mr-2 transition-colors duration-200
                      ${isActive(item.href) 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-neutral-500 dark:text-neutral-500'
                      }`
                    } 
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              Logout
            </button>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500
                  hover:text-neutral-900 hover:bg-neutral-100 
                  dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-700
                  transition-colors duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-700">
          <div className="pt-2 pb-3 space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-2 text-base font-medium
                  transition-colors duration-200
                  ${isActive(item.href)
                    ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-500'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:border-l-4 hover:border-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:border-neutral-600'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon 
                  className={`h-5 w-5 mr-3 transition-colors duration-200
                    ${isActive(item.href) 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-neutral-500 dark:text-neutral-500'
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