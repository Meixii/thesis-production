import { ReactNode } from 'react';

interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onClick,
  children,
  className = ''
}) => {
  const baseStyles = 'flex items-center justify-center w-full px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg';
  
  const providerStyles = {
    google: 'border border-neutral-200 dark:border-neutral-700 text-text-primary dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800',
    facebook: 'border border-neutral-200 dark:border-neutral-700 text-text-primary dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
  };

  const providerIcons = {
    google: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
        />
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
    )
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${providerStyles[provider]} ${className}`}
    >
      {providerIcons[provider]}
      <span>{children}</span>
    </button>
  );
};

export default SocialButton; 