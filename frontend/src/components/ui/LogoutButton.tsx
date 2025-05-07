import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import ConfirmModal from './ConfirmModal';
import { logout } from '../../utils/auth';
import { useToast } from '../../context/ToastContext';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'link' | 'danger';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'link',
  className = '',
  showIcon = true,
  children,
  onLogout
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmedLogout = async () => {
    await logout(navigate, {
      onSuccess: () => {
        if (onLogout) onLogout();
        showToast('You have been successfully logged out', 'success');
      }
    });
    setShowConfirmModal(false);
  };

  return (
    <>
      <Button
        variant={variant}
        className={`${className}`}
        onClick={handleLogoutClick}
      >
        {showIcon && (
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
        )}
        {children || 'Logout'}
      </Button>
      
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmedLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You'll need to log in again to access your account."
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </>
  );
};

export default LogoutButton;