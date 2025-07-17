import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, Mail, MailOpen, Archive, ArchiveX } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  type: 'reminder' | 'confirmation' | 'alert' | 'loan_update' | 'expense_update' | 'contribution_update';
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  created_at: string;
  target_url?: string;
  archived?: boolean;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/notifications/unread-count'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/notifications?limit=10'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/notifications/mark-read'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        
        // Update unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/notifications/mark-all-read'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      await fetchNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    setIsOpen(false);
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleArchiveToggle = async (notification: Notification) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/api/notifications/${notification.id}/${notification.archived ? 'unarchive' : 'archive'}`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, archived: !n.archived } : n));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-neutral-700">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-center gap-3 p-4 border-b border-gray-200 dark:border-neutral-700 transition-all cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-900/20 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-neutral-800'} ${notification.archived ? 'opacity-60' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={!notification.is_read}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification);
                  }}
                >
                  <div className="flex-shrink-0 pt-1">
                    {notification.type === 'confirmation' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {notification.type === 'alert' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                    {notification.type === 'reminder' && <MailOpen className="w-5 h-5 text-blue-500" />}
                    {!['confirmation', 'alert', 'reminder'].includes(notification.type) && <Mail className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''} text-gray-900 dark:text-white`}>{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</p>
                  </div>
                  <button
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={notification.archived ? 'Unarchive' : 'Archive'}
                    onClick={e => { e.stopPropagation(); handleArchiveToggle(notification); }}
                  >
                    {notification.archived ? <ArchiveX className="w-5 h-5 text-gray-400" /> : <Archive className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-neutral-700">
            <Link
              to="/notifications"
              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 