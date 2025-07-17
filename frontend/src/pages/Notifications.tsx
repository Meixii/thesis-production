import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, ArchiveX, Mail, MailOpen } from 'lucide-react';

interface Notification {
  id: number;
  message: string;
  type: string;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  archived: boolean;
  created_at: string;
  target_url?: string | null;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onReadToggle: (id: number, read: boolean) => void;
  onArchiveToggle: (id: number, archived: boolean) => void;
  onClick: (notification: Notification) => void;
}> = ({ notification, onReadToggle, onArchiveToggle, onClick }) => {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-900/20 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-neutral-800'} ${notification.archived ? 'opacity-60' : ''}`}
      onClick={() => onClick(notification)}
      tabIndex={0}
      role="button"
      aria-pressed={!notification.is_read}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onClick(notification);
      }}
    >
      <div className="flex-shrink-0 pt-1">
        {/* Icon by type */}
        {notification.type === 'alert' && (
          <ArchiveX size={24} className="text-yellow-500" />
        )}
        {notification.type === 'confirmation' && (
          <MailOpen size={24} className="text-green-500" />
        )}
        {notification.type === 'reminder' && (
          <Mail size={24} className="text-blue-500" />
        )}
        {/* Default icon */}
        {!['alert', 'confirmation', 'reminder'].includes(notification.type) && (
          <Archive size={24} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{notification.message}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</div>
      </div>
      <div className="flex gap-2 items-center ml-2">
        <button
          className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          title={notification.is_read ? 'Mark as Unread' : 'Mark as Read'}
          onClick={e => { e.stopPropagation(); onReadToggle(notification.id, !notification.is_read); }}
        >
          {notification.is_read ? (
            <Mail size={20} className="text-blue-400" />
          ) : (
            <MailOpen size={20} className="text-blue-600" />
          )}
        </button>
        <button
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={notification.archived ? 'Unarchive' : 'Archive'}
          onClick={e => { e.stopPropagation(); onArchiveToggle(notification.id, !notification.archived); }}
        >
          {notification.archived ? (
            <ArchiveX size={20} className="text-gray-400" />
          ) : (
            <Archive size={20} className="text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = getApiUrl('/api/notifications?limit=50');
      if (filter === 'unread') url += '&unreadOnly=true';
      if (filter === 'archived') url += '&archived=true';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const handleReadToggle = async (id: number, read: boolean) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/api/notifications/mark-read'), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: [id] })
    });
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: read } : n));
  };

  const handleArchiveToggle = async (id: number, archived: boolean) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/api/notifications/${id}/${archived ? 'archive' : 'unarchive'}`), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, archived } : n));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            onClick={() => navigate(-1)}
            title="Back"
          >
            <ArrowLeft size={24} className="text-gray-500 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">Notifications</h1>
        </div>
        <div className="flex gap-2 mb-4">
          <Button variant={filter === 'all' ? 'primary' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'unread' ? 'primary' : 'outline'} onClick={() => setFilter('unread')}>Unread</Button>
          <Button variant={filter === 'archived' ? 'primary' : 'outline'} onClick={() => setFilter('archived')}>Archived</Button>
        </div>
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No notifications found.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onReadToggle={handleReadToggle}
                  onArchiveToggle={handleArchiveToggle}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage; 