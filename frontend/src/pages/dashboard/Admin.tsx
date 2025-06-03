import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/layouts/Navigation';
import WeeksAdmin from '../../components/admin/WeeksAdmin';
import UsersAdmin from '../../components/admin/UsersAdmin';
import GroupsAdmin from '../../components/admin/GroupsAdmin';
import Button from '../../components/ui/Button';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const Admin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('thesis-weeks');
  const [exporting, setExporting] = useState(false);

  // Helper to trigger file download
  const handleExport = async (type: 'sql' | 'csv') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/api/admin/export-db?type=${type}`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'sql' ? 'thesis_db_export.sql' : 'thesis_db_csv_export.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Database export started!', 'success');
    } catch (err) {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation
        userRole="admin"
        onLogout={() => {
          localStorage.removeItem('token');
          navigate('/login');
        }}
      />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage thesis weeks, user roles, and groups
          </p>
        </div>
        {/* Export Database Card */}
        <div className="mb-8 bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Export Database</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Download a full backup of the database for migration or analysis. Only admins can access this feature.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => handleExport('sql')} disabled={exporting} variant="primary">
              {exporting ? (
                <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>Exporting...</span>
              ) : 'Export as SQL (Schema + Data)'}
            </Button>
            <Button onClick={() => handleExport('csv')} disabled={exporting} variant="outline">
              {exporting ? (
                <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-600 rounded-full"></span>Exporting...</span>
              ) : 'Export as CSV (ZIP)'}
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('thesis-weeks')}
                className={`inline-block py-4 px-4 text-sm font-medium ${
                  activeTab === 'thesis-weeks'
                    ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Thesis Weeks
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`inline-block py-4 px-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Users
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('groups')}
                className={`inline-block py-4 px-4 text-sm font-medium ${
                  activeTab === 'groups'
                    ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Groups
              </button>
            </li>
          </ul>
        </div>
        {/* Tab Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          {activeTab === 'thesis-weeks' && <WeeksAdmin />}
          {activeTab === 'users' && <UsersAdmin />}
          {activeTab === 'groups' && <GroupsAdmin />}
        </div>
      </main>
    </div>
  );
};

export default Admin; 