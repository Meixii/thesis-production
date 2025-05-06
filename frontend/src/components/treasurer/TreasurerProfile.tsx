import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../ui/Navigation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DashboardCard from '../dashboard/DashboardCard';

interface TreasurerProfile {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string;
  group_name: string;
  group_id: number;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string | null;
  total_students: number;
  total_dues: number;
  total_collected: number;
}

const TreasurerProfile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TreasurerProfile | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: ''
  });

  useEffect(() => {
    fetchProfileAndGroupDetails();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchProfileAndGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const [profileResponse, groupResponse] = await Promise.all([
        fetch(getApiUrl('/api/treasurer/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(getApiUrl('/api/treasurer/group'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!profileResponse.ok || !groupResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const profileData = await profileResponse.json();
      const groupData = await groupResponse.json();

      setProfile(profileData);
      setGroupDetails(groupData);
      setEditForm({
        first_name: profileData.first_name,
        middle_name: profileData.middle_name || '',
        last_name: profileData.last_name,
        suffix: profileData.suffix || ''
      });
    } catch (error) {
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your profile and view group information
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/treasurer')}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={editForm.middle_name}
                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suffix
                      </label>
                      <input
                        type="text"
                        value={editForm.suffix}
                        onChange={(e) => setEditForm({ ...editForm, suffix: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm"
                        placeholder="Jr., Sr., III, etc."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {profile?.first_name} {profile?.middle_name} {profile?.last_name} {profile?.suffix}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{profile?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">Treasurer</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Group Information */}
          <div className="lg:col-span-1">
            <DashboardCard
              title="Group Information"
              subtitle={groupDetails?.name || 'Loading...'}
            >
              <div className="p-4 space-y-4">
                {groupDetails && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {groupDetails.total_students}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Dues</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {groupDetails.total_dues}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</h3>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(groupDetails.total_collected)}
                      </p>
                    </div>
                    {groupDetails.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {groupDetails.description}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </DashboardCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TreasurerProfile; 