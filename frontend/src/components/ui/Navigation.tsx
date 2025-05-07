import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';

interface NavigationProps {
  userRole: 'student' | 'finance_coordinator' | 'treasurer' | 'admin';
  onLogout: () => void;
  groupType?: 'thesis' | 'section';
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactElement;
  roles?: string[];
}

const TypewriterEffect: React.FC = () => {
  const phrases = [
    "made by mika",
    "made w/ alt+3",
    "kakomsai layf",
    "gimme coffee",
    "thesis mode on",
    "sleep deprived",
    "bug-free code",
    "please work",
    "ctrl+s for life",
    "lorem ipsum",
    "creating bugs",
    "push to main",
    "merge conflicts",
    "help me grok",
    "late night coding",
    "hydrate or isekai",
    "commit early",
    "reviewing PRs",
    "unit test hero",
    "refactor time",
    "pull request",
    "feature freeze",
    "npm install",
    "npm run dev",
    "lowfi is life",
    "Omae wa mou",
    "syntax error",
    "404 not found",
    "console.log life",
    "import caffeine",
    "alt+tab master",
    "gl sa ojt <3",
    "zengarden dev"
  ];

  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [pauseEnd, setPauseEnd] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timer: number | undefined;

    if (pauseEnd) {
      // Pause at the end of the phrase for 5 seconds (reduced from 10)
      timer = setTimeout(() => {
        setPauseEnd(false);
        setIsDeleting(true);
      }, 5000);
    } else if (isDeleting) {
      // Delete characters
      if (currentText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setTypingSpeed(150); // Reset typing speed
      } else {
        timer = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
          setTypingSpeed(50); // Faster when deleting
        }, typingSpeed);
      }
    } else {
      // Type characters
      if (currentText === currentPhrase) {
        setPauseEnd(true);
      } else {
        timer = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        }, typingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, phrases, typingSpeed, pauseEnd]);

  return (
    <div className="italic text-xs text-gray-400 dark:text-gray-500 -mt-1 ml-0 min-w-[110px] h-4 text-left">
      {currentText}
      <span className="animate-pulse">_</span>
    </div>
  );
};

const Navigation = ({ userRole, onLogout, groupType }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Get navigation items based on user role
  const getTreasurerNavItems = (): NavItem[] => [
  {
    name: 'Dashboard',
      href: '/treasurer',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      )
  },
  {
      name: 'Create Due',
      href: '/treasurer/dues/new',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      )
  },
  {
      name: 'Dues List',
      href: '/treasurer/dues',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      )
  },
  {
      name: 'Pending Payments',
      href: '/treasurer/payments/pending',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      )
  },
  {
      name: 'Export Data',
      href: '/treasurer/export',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      )
    }
  ];

  const getFCNavItems = (): NavItem[] => [
  {
      name: 'Dashboard',
      href: '/dashboard/fc',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      )
  },
  {
    name: 'Members',
    href: '/members',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      )
    },
    {
      name: 'Verify Payments',
      href: '/verify-payments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
  },
  {
    name: 'Loan Management',
    href: '/loans',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
    name: 'Expenses',
    href: '/expenses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['finance_coordinator']
  },
  {
      name: 'Group Settings',
      href: '/group-settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      )
  }
];

  const getStudentNavItems = (): NavItem[] => [
    {
      name: 'Dashboard',
      href: '/dashboard/student',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Make Payment',
      href: '/payment',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'My Loans',
      href: '/loans/my-loans',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const getSectionStudentNavItems = (): NavItem[] => [
    {
      name: 'Dashboard',
      href: '/dashboard/section',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    }
  ];

  const getAdminNavItems = (): NavItem[] => [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },


  ];

  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case 'treasurer':
        return getTreasurerNavItems();
      case 'finance_coordinator':
        return getFCNavItems();
      case 'admin':
        return getAdminNavItems();
      case 'student':
        if (groupType === 'section') {
          return getSectionStudentNavItems();
        }
        return getStudentNavItems();
      default:
        return [];
    }
  };

  const isActive = (path: string) => {
    if (path === '/treasurer' && location.pathname === '/treasurer') {
      return true;
    }
    if (path === '/dashboard/fc' && location.pathname === '/dashboard/fc') {
      return true;
    }
    if (path === '/dashboard/student' && location.pathname === '/dashboard/student') {
      return true;
    }
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && 
           !path.endsWith('/dashboard') &&
           path !== '/treasurer' && 
           path !== '/dashboard/fc' && 
           path !== '/dashboard/student' && 
           path !== '/admin';
  };

  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex flex-col items-start justify-center mr-6">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                CS<span className="text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.7)]">Bank</span>
              </span>
              <TypewriterEffect />
            </div>
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-6 lg:flex lg:space-x-4">
              {getNavItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile and Logout Section - Desktop */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
            <Link
              to={`/profile`}
              className={`${
                location.pathname === '/profile'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
              } flex items-center text-sm font-medium transition-colors`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            <LogoutButton
              variant="link"
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 flex items-center text-sm font-medium transition-colors"
              onLogout={onLogout}
            />
          </div>
            
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none transition-colors"
              aria-expanded={isOpen}
            >
              <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
              {isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:hidden transition-all duration-200 ease-in-out`}>
        <div className="pt-2 pb-3 space-y-1">
          {getNavItems().map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center transition-colors`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
          <Link
            to={`/profile`}
            className={`${
              location.pathname === '/profile'
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center transition-colors`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </Link>
          <LogoutButton
            variant="link"
            className="w-full border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center transition-colors"
            onLogout={onLogout}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;