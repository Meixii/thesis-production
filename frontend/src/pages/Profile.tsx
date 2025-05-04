import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import Navigation from '../components/ui/Navigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import JoinGroup from '../components/groups/JoinGroup';
import { useToast } from '../context/ToastContext';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  profilePictureUrl?: string;
  role: string;
  groupId?: number;
  groupName?: string;
  emailVerified: boolean;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  code?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile data');
        }

        // Try to extract profile data from different possible response structures
        let profileData: UserProfile;
        if (data.data) {
          profileData = data.data;
        } else if (data.user) {
          profileData = data.user;
        } else {
          profileData = data;
        }

        // Log the structure to help with debugging
        console.log('Profile data structure:', data);

        // Extract group information if available
        if (profileData.groupId) {
          // If there's no group name already but we have a group ID, fetch the group details
          if (!profileData.groupName) {
            try {
              const groupResponse = await fetch(getApiUrl(`/api/groups/${profileData.groupId}`), {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (groupResponse.ok) {
                const groupData = await groupResponse.json();
                // Group name may be in different fields depending on the API response
                profileData.groupName = groupData.group_name || groupData.name || 'Group ' + profileData.groupId;
              }
            } catch (groupErr) {
              console.error('Failed to fetch group details:', groupErr);
            }
          }
        }

        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || '',
          middleName: profileData.middleName || '',
          lastName: profileData.lastName || '',
          suffix: profileData.suffix || '',
          email: profileData.email || ''
        });
      } catch (err) {
        console.error('Profile error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/update-profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local profile state with new data
      if (profile) {
        setProfile({
          ...profile,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          suffix: formData.suffix
        });
      }

      setEditMode(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinGroupSuccess = () => {
    showToast('Successfully joined group!', 'success');
    // Reload the profile data to get updated group information
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave your current group?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/student/leave-group'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave group');
      }

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          groupId: undefined,
          groupName: undefined
        });
      }

      showToast('Successfully left group', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  // Generate Group Code for Finance Coordinators
  const handleGenerateGroupCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/groups/${profile?.groupId}/regenerate-code`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate new group code');
      }

      showToast('New group code generated successfully!', 'success');
      // Reload profile data to get updated group information
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate new group code');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine if user is a Finance Coordinator
  const isFinanceCoordinator = profile?.role === 'finance_coordinator';

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation onLogout={handleLogout} userRole={isFinanceCoordinator ? 'finance_coordinator' : 'student'} />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isFinanceCoordinator ? 'Finance Coordinator Profile' : 'Student Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account information{isFinanceCoordinator ? ' and group settings' : ' and group membership'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="md:col-span-2">
            <Card variant="default" className="bg-white dark:bg-neutral-800 shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Personal Information
                </h2>

                {editMode ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                      <Input
                        id="middleName"
                        name="middleName"
                        label="Middle Name"
                        value={formData.middleName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                      <Input
                        id="suffix"
                        name="suffix"
                        label="Suffix"
                        value={formData.suffix}
                        onChange={handleInputChange}
                        placeholder="e.g., Jr., Sr., III"
                      />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                      helperText="Email cannot be changed"
                    />

                    <div className="pt-4 flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={saving}
                        loadingText="Saving..."
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Full Name
                        </h3>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">
                          {profile?.firstName} {profile?.middleName} {profile?.lastName} {profile?.suffix}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </h3>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">
                          {profile?.email}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Account Type
                        </h3>
                        <p className="mt-1 text-base text-gray-900 dark:text-white">
                          {isFinanceCoordinator ? 'Finance Coordinator' : 'Student'}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email Verification
                        </h3>
                        <p className="mt-1 text-base">
                          {profile?.emailVerified ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center">
                              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Verified
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 flex items-center">
                              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Not verified
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="primary"
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Group Management Card - Different for Students vs Finance Coordinators */}
          <div>
            <Card variant="default" className="bg-white dark:bg-neutral-800 shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isFinanceCoordinator ? 'Group Management' : 'Group Membership'}
                </h2>

                {profile?.groupId ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Current Group
                      </h3>
                      <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                        {profile.groupName || 'Unknown Group'}
                      </p>
                    </div>

                    {isFinanceCoordinator ? (
                      // Finance Coordinator Group Management UI
                      <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            As the Finance Coordinator, you manage this group's financial activities and member access.
                          </p>
                        </div>

                        <div className="pt-4 space-y-3">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleGenerateGroupCode}
                          >
                            Generate New Group Code
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/dashboard/fc')}
                          >
                            View Group Dashboard
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Student Group Membership UI
                      <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            You are currently a member of this group. All your financial contributions and loans are associated with this group.
                          </p>
                        </div>

                        <div className="pt-4">
                          <Button
                            variant="outline"
                            className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={handleLeaveGroup}
                          >
                            Leave Group
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // No Group UI - Same for both roles
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            No Group Assigned
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                            <p>
                              {isFinanceCoordinator
                                ? 'You need to be assigned to a group to manage finances and members.'
                                : 'You need to be a member of a group to track finances and make contributions.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setJoinGroupModalOpen(true)}
                    >
                      Join a Group
                    </Button>

                    {!isFinanceCoordinator && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Ask your Finance Coordinator for your group code
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Additional FC-specific card */}
            {isFinanceCoordinator && profile?.groupId && (
              <Card variant="default" className="bg-white dark:bg-neutral-800 shadow-sm mt-6">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Finance Coordinator Tools
                  </h2>
                  
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/members')}
                    >
                      Manage Group Members
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/verify-payments')}
                    >
                      Verify Pending Payments
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/expenses')}
                    >
                      Manage Expenses
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/loans/intra')}
                    >
                      Review Loan Requests
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Join Group Modal */}
      <JoinGroup
        isOpen={joinGroupModalOpen}
        onClose={() => setJoinGroupModalOpen(false)}
        onSuccess={handleJoinGroupSuccess}
      />
    </div>
  );
};

export default Profile; 