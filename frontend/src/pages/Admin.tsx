import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import Navigation from '../components/ui/Navigation';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

interface ThesisWeek {
  id: number;
  week_number: number;
  start_date: string;
  end_date: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  group_id?: number | null;
  group?: {
    id: number;
    name: string;
  };
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  created_at?: string;
}

interface Group {
  id: number;
  name?: string;
  group_name: string;
  group_type: 'thesis' | 'section';
  budget_goal: number;
  max_intra_loan_per_student: number;
  max_inter_loan_limit: number;
  intra_loan_flat_fee: number;
  group_code: string;
  member_count?: number;
}

interface EditingGroup extends Omit<Group, 'budget_goal' | 'max_intra_loan_per_student' | 'max_inter_loan_limit' | 'intra_loan_flat_fee'> {
  budget_goal: string;
  max_intra_loan_per_student: string;
  max_inter_loan_limit: string;
  intra_loan_flat_fee: string;
}

interface NewGroup {
  group_name: string;
  group_type: 'thesis' | 'section';
  budget_goal: string;
  max_intra_loan_per_student: string;
  max_inter_loan_limit: string;
  intra_loan_flat_fee: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('thesis-weeks');
  const [loading, setLoading] = useState(true);
  
  // Thesis Weeks State
  const [thesisWeeks, setThesisWeeks] = useState<ThesisWeek[]>([]);
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ThesisWeek | null>(null);
  const [newWeek, setNewWeek] = useState<{
    week_number: string;
    start_date: string;
    end_date: string;
  }>({
    week_number: '',
    start_date: '',
    end_date: ''
  });
  
  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isUpdateUserModalOpen, setIsUpdateUserModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isUserSelectMode, setIsUserSelectMode] = useState(false);
  const [isMultiDeleteUserModalOpen, setIsMultiDeleteUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    email: string;
    role: string;
    group_id: string;
    password: string;
  }>({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    role: 'student',
    group_id: '',
    password: ''
  });
  
  // Groups State
  const [groups, setGroups] = useState<Group[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EditingGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [isUpdateGroupModalOpen, setIsUpdateGroupModalOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false);
  const [isMultiDeleteGroupModalOpen, setIsMultiDeleteGroupModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroup>({
    group_name: '',
    group_type: 'thesis',
    budget_goal: '0',
    max_intra_loan_per_student: '100',
    max_inter_loan_limit: '500',
    intra_loan_flat_fee: '10'
  });

  // Track if end date was manually changed
  const [endDateManuallyChanged, setEndDateManuallyChanged] = useState(false);

  // Bulk Add Weeks
  const [bulkAddCount, setBulkAddCount] = useState(1);
  const [bulkAddLoading, setBulkAddLoading] = useState(false);

  // Confirmation Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [weekToDelete, setWeekToDelete] = useState<number | null>(null);
  
  // Multi-selection
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Initially load data based on active tab
    if (activeTab === 'thesis-weeks') {
      fetchThesisWeeks();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [navigate, activeTab]);

  const fetchThesisWeeks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/thesis-weeks'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          showToast('Access denied. Admin privileges required.', 'error');
          navigate('/');
          return;
        }
        throw new Error(data.error || 'Failed to fetch thesis weeks');
      }
      
      const data = await response.json();
      setThesisWeeks(data.thesis_weeks);
    } catch (error) {
      console.error('Error fetching thesis weeks:', error);
      showToast('Failed to load thesis weeks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/groups'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          showToast('Access denied. Admin privileges required.', 'error');
          navigate('/');
          return;
        }
        throw new Error(data.error || 'Failed to fetch groups');
      }
      
      const data = await response.json();
      // Log the received data to check its structure
      console.log('Fetched groups:', data);
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    
    // Reset all selection modes when changing tabs
    setIsSelectMode(false);
    setSelectedWeeks([]);
    setIsUserSelectMode(false);
    setSelectedUsers([]);
    setIsGroupSelectMode(false);
    setSelectedGroups([]);

    // Fetch data based on the selected tab
    if (tab === 'thesis-weeks') {
      fetchThesisWeeks();
    } else if (tab === 'users') {
      fetchUsers();
    } else if (tab === 'groups') {
      fetchGroups();
    }
  };

  // Enhanced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'start_date') {
      // Auto-update end date if not manually changed
      let newEndDate = newWeek.end_date;
      if ((!endDateManuallyChanged || value > newWeek.end_date) && value) {
        const start = new Date(value);
        const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        newEndDate = end.toISOString().split('T')[0];
      }
      setNewWeek(prev => ({ ...prev, [name]: value, end_date: newEndDate }));
    } else if (name === 'end_date') {
      setEndDateManuallyChanged(true);
      setNewWeek(prev => ({ ...prev, [name]: value }));
    } else {
      setNewWeek(prev => ({ ...prev, [name]: value }));
    }
  };

  // When opening the add/edit form, reset manual end date tracking
  const openAddWeekForm = () => {
    setNewWeek(getNextWeekDefaults());
    setIsAddingWeek(true);
    setEndDateManuallyChanged(false);
  };

  const handleAddThesisWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/thesis-weeks'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          week_number: parseInt(newWeek.week_number),
          start_date: newWeek.start_date,
          end_date: newWeek.end_date
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add thesis week');
      }
      
      await fetchThesisWeeks();
      setIsAddingWeek(false);
      setNewWeek({
        week_number: '',
        start_date: '',
        end_date: ''
      });
      showToast('Thesis week added successfully', 'success');
    } catch (error) {
      console.error('Error adding thesis week:', error);
      showToast('Failed to add thesis week', 'error');
    }
  };

  const handleUpdateThesisWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingWeek) return;
    
    setIsUpdateModalOpen(true);
  };

  const confirmUpdateThesisWeek = async () => {
    if (!editingWeek) return;
    
    try {
      setIsUpdateModalOpen(false);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/thesis-weeks/${editingWeek.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingWeek.id,
          week_number: parseInt(newWeek.week_number),
          start_date: newWeek.start_date,
          end_date: newWeek.end_date
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update thesis week');
      }
      
      await fetchThesisWeeks();
      setEditingWeek(null);
      setNewWeek({
        week_number: '',
        start_date: '',
        end_date: ''
      });
      showToast('Thesis week updated successfully', 'success');
    } catch (error) {
      console.error('Error updating thesis week:', error);
      showToast('Failed to update thesis week', 'error');
    }
  };

  const openDeleteConfirmModal = (id: number) => {
    setWeekToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteThesisWeek = async () => {
    if (!weekToDelete) return;
    
    try {
      setIsDeleteModalOpen(false);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/thesis-weeks/${weekToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete thesis week');
      }
      
      await fetchThesisWeeks();
      setWeekToDelete(null);
      showToast('Thesis week deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting thesis week:', error);
      showToast('Failed to delete thesis week', 'error');
    }
  };

  // Multi-selection deletion
  const toggleWeekSelection = (id: number) => {
    setSelectedWeeks(prev => 
      prev.includes(id) 
        ? prev.filter(weekId => weekId !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedWeeks([]);
  };

  const openMultiDeleteConfirmModal = () => {
    if (selectedWeeks.length === 0) {
      showToast('Please select at least one week to delete', 'error');
      return;
    }
    setIsMultiDeleteModalOpen(true);
  };

  const handleMultiDeleteThesisWeeks = async () => {
    if (selectedWeeks.length === 0) return;
    
    try {
      setIsMultiDeleteModalOpen(false);
      const token = localStorage.getItem('token');
      
      // Delete weeks one by one
      for (const id of selectedWeeks) {
        // eslint-disable-next-line no-await-in-loop
        await fetch(getApiUrl(`/api/admin/thesis-weeks/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      await fetchThesisWeeks();
      setSelectedWeeks([]);
      setIsSelectMode(false);
      showToast(`${selectedWeeks.length} thesis week(s) deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting thesis weeks:', error);
      showToast('Failed to delete thesis weeks', 'error');
    }
  };

  const startEditingWeek = (week: ThesisWeek) => {
    setEditingWeek(week);
    setNewWeek({
      week_number: String(week.week_number),
      start_date: new Date(week.start_date).toISOString().split('T')[0],
      end_date: new Date(week.end_date).toISOString().split('T')[0]
    });
    setEndDateManuallyChanged(false);
  };

  const cancelEditing = () => {
    setEditingWeek(null);
    setIsAddingWeek(false);
    setNewWeek({
      week_number: '',
      start_date: '',
      end_date: ''
    });
    setEndDateManuallyChanged(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to get next week defaults
  const getNextWeekDefaults = () => {
    if (thesisWeeks.length === 0) {
      const today = new Date();
      const start = today.toISOString().split('T')[0];
      const end = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        week_number: '1',
        start_date: start,
        end_date: end
      };
    } else {
      const lastWeek = thesisWeeks[thesisWeeks.length - 1];
      const lastEnd = new Date(lastWeek.end_date);
      // Next week starts the day after last end date
      const nextStart = new Date(lastEnd.getTime() + 24 * 60 * 60 * 1000);
      const nextEnd = new Date(nextStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      return {
        week_number: String(Number(lastWeek.week_number) + 1),
        start_date: nextStart.toISOString().split('T')[0],
        end_date: nextEnd.toISOString().split('T')[0]
      };
    }
  };

  // Bulk Add Weeks
  const handleBulkAddWeeks = async () => {
    setBulkAddLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First fetch the latest weeks to ensure we have the most up-to-date data
      const response = await fetch(getApiUrl('/api/admin/thesis-weeks'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest thesis weeks');
      }
      
      const data = await response.json();
      const latestWeeks = data.thesis_weeks;
      
      for (let i = 0; i < bulkAddCount; i++) {
        // Always get the latest end date after each addition
        const updatedResponse = i === 0 
          ? { thesis_weeks: latestWeeks } 
          : await (await fetch(getApiUrl('/api/admin/thesis-weeks'), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })).json();
        
        const updatedWeeks = updatedResponse.thesis_weeks;
        const lastWeek = updatedWeeks.length > 0 
          ? updatedWeeks[updatedWeeks.length - 1] 
          : null;
        
        const lastEndDate = lastWeek 
          ? new Date(lastWeek.end_date) 
          : new Date();
        const lastWeekNumber = lastWeek 
          ? Number(lastWeek.week_number) 
          : 0;
        
        const start = new Date(lastEndDate.getTime() + 24 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        const week_number = lastWeekNumber + 1;
        
        // eslint-disable-next-line no-await-in-loop
        await fetch(getApiUrl('/api/admin/thesis-weeks'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            week_number,
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0]
          })
        });
      }
      
      await fetchThesisWeeks();
      showToast(`${bulkAddCount} week(s) added successfully`, 'success');
    } catch (error) {
      console.error('Error adding thesis weeks:', error);
      showToast('Failed to add thesis weeks', 'error');
    } finally {
      setBulkAddLoading(false);
      setBulkAddCount(1);
    }
  };

  // Render tabs
  const renderThesisWeeksTab = () => {
    if (loading && thesisWeeks.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Thesis Weeks Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Manage the weekly periods for thesis contributions and deadlines
            </p>
          </div>
          <div className="flex space-x-2">
            {isSelectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Cancel Selection
                </Button>
                <Button
                  variant="secondary"
                  onClick={openMultiDeleteConfirmModal}
                  disabled={selectedWeeks.length === 0}
                >
                  Delete Selected ({selectedWeeks.length})
                </Button>
              </>
            ) : (
              <>
                {!isAddingWeek && !editingWeek && (
                  <>
                    <Button
                      variant="outline"
                      onClick={toggleSelectMode}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Select Multiple
                    </Button>
                    <Button
                      variant="primary"
                      onClick={openAddWeekForm}
                    >
                      Add New Week
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Thesis Week Form */}
        {(isAddingWeek || editingWeek) && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingWeek ? 'Edit Thesis Week' : 'Add New Thesis Week'}
              </h3>
              <Button
                variant="outline"
                className="p-2 h-9 w-9 rounded-full border-gray-300 dark:border-gray-600"
                onClick={cancelEditing}
              >
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <form onSubmit={handleUpdateThesisWeek} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    name="week_number"
                    value={newWeek.week_number}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={newWeek.start_date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={newWeek.end_date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  {editingWeek ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Add Weeks - Enhanced UI */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bulk Add Thesis Weeks
            </h3>
            {thesisWeeks.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Last Week: #{thesisWeeks[thesisWeeks.length - 1].week_number} 
                ({formatDate(thesisWeeks[thesisWeeks.length - 1].end_date)})
              </span>
            )}
          </div>
          
          <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
            Quickly add multiple weeks with consecutive dates. Each week will start the day after the previous week ends.
          </p>
          
          <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Weeks to Add
                </label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setBulkAddCount(Math.max(1, bulkAddCount - 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                    disabled={bulkAddLoading || bulkAddCount <= 1}
                  >
                    <span className="sr-only">Decrease</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={bulkAddCount}
                    onChange={e => setBulkAddCount(Number(e.target.value))}
                    className="w-20 p-2 text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                    disabled={bulkAddLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setBulkAddCount(Math.min(52, bulkAddCount + 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                    disabled={bulkAddLoading || bulkAddCount >= 52}
                  >
                    <span className="sr-only">Increase</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-grow sm:flex-grow-0">
                <Button
                  variant="primary"
                  onClick={handleBulkAddWeeks}
                  isLoading={bulkAddLoading}
                  loadingText="Adding..."
                  disabled={bulkAddLoading || bulkAddCount < 1}
                  className="w-full sm:w-auto"
                >
                  Add {bulkAddCount} Week{bulkAddCount > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
            
            {thesisWeeks.length > 0 && (
              <div className="mt-4 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-medium">Preview:</span> Will add {bulkAddCount} week(s) starting from Week {
                      Number(thesisWeeks[thesisWeeks.length - 1].week_number) + 1
                    } 
                    <span className="block mt-1">Starting date: {
                      new Date(new Date(thesisWeeks[thesisWeeks.length - 1].end_date).getTime() + 24 * 60 * 60 * 1000)
                        .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                    }</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thesis Weeks Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-neutral-700">
              <tr>
                {isSelectMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        checked={selectedWeeks.length > 0 && selectedWeeks.length === thesisWeeks.length}
                        onChange={() => {
                          if (selectedWeeks.length === thesisWeeks.length) {
                            setSelectedWeeks([]);
                          } else {
                            setSelectedWeeks(thesisWeeks.map(week => week.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                      />
                      <span className="ml-2">Select All</span>
                    </div>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Week #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
              {thesisWeeks.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No thesis weeks found. Add your first one!
                  </td>
                </tr>
              ) : (
                thesisWeeks.map((week) => (
                  <tr 
                    key={week.id} 
                    className={`${selectedWeeks.includes(week.id) 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}`}
                  >
                    {isSelectMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <input 
                          type="checkbox"
                          checked={selectedWeeks.includes(week.id)}
                          onChange={() => toggleWeekSelection(week.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {week.week_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(week.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(week.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEditingWeek(week)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSelectMode}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirmModal(week.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSelectMode}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Confirmation Modals */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteThesisWeek}
          title="Delete Thesis Week"
          message="Are you sure you want to delete this week? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="secondary"
        />

        <ConfirmModal
          isOpen={isMultiDeleteModalOpen}
          onClose={() => setIsMultiDeleteModalOpen(false)}
          onConfirm={handleMultiDeleteThesisWeeks}
          title="Delete Multiple Thesis Weeks"
          message={`Are you sure you want to delete ${selectedWeeks.length} selected week(s)? This action cannot be undone.`}
          confirmText="Delete All"
          confirmVariant="secondary"
        />

        <ConfirmModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onConfirm={confirmUpdateThesisWeek}
          title="Update Thesis Week"
          message="Are you sure you want to update this week's details?"
          confirmText="Update"
        />
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="p-4">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">User Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Manage user accounts, roles, and group assignments
            </p>
          </div>
          <div className="flex space-x-2">
            {isUserSelectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUserSelectMode(false);
                    setSelectedUsers([]);
                  }}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Cancel Selection
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (selectedUsers.length > 0) {
                      setIsMultiDeleteUserModalOpen(true);
                    } else {
                      showToast('Please select at least one user to delete', 'error');
                    }
                  }}
                  disabled={selectedUsers.length === 0}
                >
                  Delete Selected ({selectedUsers.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsUserSelectMode(true)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Select Multiple
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsAddingUser(true)}
                >
                  Add New User
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-grow">
              <label htmlFor="userSearch" className="sr-only">Search users</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="search"
                  id="userSearch"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-neutral-700">
              <tr>
                {isUserSelectMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === users.length}
                        onChange={() => {
                          if (selectedUsers.length === users.length) {
                            setSelectedUsers([]);
                          } else {
                            setSelectedUsers(users.map(user => user.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                      />
                      <span className="ml-2">Select All</span>
                    </div>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={isUserSelectMode ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users
                  .filter(user => 
                    userSearchQuery === '' ||
                    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map((user) => (
                    <tr
                      key={user.id}
                      className={`${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      {isUserSelectMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {
                              setSelectedUsers(prev =>
                                prev.includes(user.id)
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : user.role === 'finance_coordinator'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {user.role === 'finance_coordinator' ? 'Finance Coordinator' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.group?.name || 'No Group'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setIsUpdateUserModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isUserSelectMode}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user.id);
                            setIsDeleteUserModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isUserSelectMode}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit User Modal */}
        {(isAddingUser || editingUser) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingUser(false);
                      setEditingUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-6">
                  {!editingUser && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={newUser.first_name}
                            onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            name="middle_name"
                            value={newUser.middle_name}
                            onChange={(e) => setNewUser({ ...newUser, middle_name: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={newUser.last_name}
                            onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Suffix
                          </label>
                          <input
                            type="text"
                            name="suffix"
                            value={newUser.suffix}
                            onChange={(e) => setNewUser({ ...newUser, suffix: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                            placeholder="Jr., Sr., III, etc."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                          required
                          minLength={8}
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={editingUser ? editingUser.role : newUser.role}
                        onChange={(e) => {
                          if (editingUser) {
                            setEditingUser({ ...editingUser, role: e.target.value });
                          } else {
                            setNewUser({ ...newUser, role: e.target.value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="student">Student</option>
                        <option value="finance_coordinator">Finance Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Group
                      </label>
                      <select
                        name="group_id"
                        value={editingUser ? editingUser.group_id ?? '' : newUser.group_id}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          if (editingUser) {
                            setEditingUser({ ...editingUser, group_id: value });
                          } else {
                            setNewUser({ ...newUser, group_id: e.target.value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                      >
                        <option value="">No Group</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name || group.group_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={editingUser.is_active}
                            onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Active
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsAddingUser(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      {editingUser ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        <ConfirmModal
          isOpen={isDeleteUserModalOpen}
          onClose={() => setIsDeleteUserModalOpen(false)}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="secondary"
        />

        <ConfirmModal
          isOpen={isMultiDeleteUserModalOpen}
          onClose={() => setIsMultiDeleteUserModalOpen(false)}
          onConfirm={handleMultiDeleteUsers}
          title="Delete Multiple Users"
          message={`Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`}
          confirmText="Delete All"
          confirmVariant="secondary"
        />
      </div>
    );
  };

  const renderGroupsTab = () => {
    if (loading) {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Group Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Manage thesis and section groups, budgets, and loan limits
              </p>
            </div>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Group Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Manage thesis and section groups, budgets, and loan limits
            </p>
          </div>
          <div className="flex space-x-2">
            {isGroupSelectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsGroupSelectMode(false);
                    setSelectedGroups([]);
                  }}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Cancel Selection
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (selectedGroups.length > 0) {
                      setIsMultiDeleteGroupModalOpen(true);
                    } else {
                      showToast('Please select at least one group to delete', 'error');
                    }
                  }}
                  disabled={selectedGroups.length === 0}
                >
                  Delete Selected ({selectedGroups.length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsGroupSelectMode(true)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Select Multiple
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsAddingGroup(true)}
                >
                  Add New Group
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-grow">
              <label htmlFor="groupSearch" className="sr-only">Search groups</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="search"
                  id="groupSearch"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search by name or code..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-neutral-700">
              <tr>
                {isGroupSelectMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedGroups.length > 0 && selectedGroups.length === groups.length}
                        onChange={() => {
                          if (selectedGroups.length === groups.length) {
                            setSelectedGroups([]);
                          } else {
                            setSelectedGroups(groups.map(group => group.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                      />
                      <span className="ml-2">Select All</span>
                    </div>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Budget Goal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={isGroupSelectMode ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No groups found
                  </td>
                </tr>
              ) : (
                groups
                  .filter(group => 
                    groupSearchQuery === '' ||
                    group.name?.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                    group.group_code.toLowerCase().includes(groupSearchQuery.toLowerCase())
                  )
                  .map((group) => (
                    <tr
                      key={group.id}
                      className={`${
                        selectedGroups.includes(group.id)
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      {isGroupSelectMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={() => {
                              setSelectedGroups(prev =>
                                prev.includes(group.id)
                                  ? prev.filter(id => id !== group.id)
                                  : [...prev, group.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {group.name || group.group_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {group.group_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ₱{group.budget_goal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {group.member_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.group_type === 'thesis'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {group.group_type.charAt(0).toUpperCase() + group.group_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEditingGroup(group)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isGroupSelectMode}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setGroupToDelete(group.id);
                            setIsDeleteGroupModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isGroupSelectMode}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Group Modal */}
        {(isAddingGroup || editingGroup) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingGroup ? 'Edit Group' : 'Add New Group'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingGroup(false);
                      setEditingGroup(null);
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={editingGroup ? handleUpdateGroup : handleAddGroup} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Group Name
                      </label>
                      <input
                        type="text"
                        name="group_name"
                        value={editingGroup ? (editingGroup.group_name || '') : newGroup.group_name}
                        onChange={(e) => {
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, group_name: e.target.value });
                          } else {
                            setNewGroup({ ...newGroup, group_name: e.target.value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Group Type
                      </label>
                      <select
                        name="group_type"
                        value={editingGroup ? editingGroup.group_type : newGroup.group_type}
                        onChange={(e) => {
                          const value = e.target.value as 'thesis' | 'section';
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, group_type: value });
                          } else {
                            setNewGroup({ ...newGroup, group_type: value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="thesis">Thesis</option>
                        <option value="section">Section</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Budget Goal
                      </label>
                      <input
                        type="number"
                        name="budget_goal"
                        value={editingGroup?.budget_goal || newGroup.budget_goal}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, budget_goal: value });
                          } else {
                            setNewGroup({ ...newGroup, budget_goal: value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Intra-Group Loan Per Student
                      </label>
                      <input
                        type="number"
                        name="max_intra_loan_per_student"
                        value={editingGroup?.max_intra_loan_per_student || newGroup.max_intra_loan_per_student}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, max_intra_loan_per_student: value });
                          } else {
                            setNewGroup({ ...newGroup, max_intra_loan_per_student: value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Inter-Group Loan Limit
                      </label>
                      <input
                        type="number"
                        name="max_inter_loan_limit"
                        value={editingGroup?.max_inter_loan_limit || newGroup.max_inter_loan_limit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, max_inter_loan_limit: value });
                          } else {
                            setNewGroup({ ...newGroup, max_inter_loan_limit: value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Intra-Group Loan Flat Fee
                      </label>
                      <input
                        type="number"
                        name="intra_loan_flat_fee"
                        value={editingGroup?.intra_loan_flat_fee || newGroup.intra_loan_flat_fee}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, intra_loan_flat_fee: value });
                          } else {
                            setNewGroup({ ...newGroup, intra_loan_flat_fee: value });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsAddingGroup(false);
                        setEditingGroup(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      {editingGroup ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modals */}
        <ConfirmModal
          isOpen={isDeleteGroupModalOpen}
          onClose={() => setIsDeleteGroupModalOpen(false)}
          onConfirm={handleDeleteGroup}
          title="Delete Group"
          message="Are you sure you want to delete this group? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="secondary"
        />

        <ConfirmModal
          isOpen={isMultiDeleteGroupModalOpen}
          onClose={() => setIsMultiDeleteGroupModalOpen(false)}
          onConfirm={handleMultiDeleteGroups}
          title="Delete Multiple Groups"
          message={`Are you sure you want to delete ${selectedGroups.length} selected group(s)? This action cannot be undone.`}
          confirmText="Delete All"
          confirmVariant="secondary"
        />
      </div>
    );
  };

  // User Management Handlers
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleteUserModalOpen(false);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/users/${userToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      await fetchUsers();
      setUserToDelete(null);
      showToast('User deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleMultiDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setIsMultiDeleteUserModalOpen(false);
      const token = localStorage.getItem('token');
      
      // Delete users one by one
      for (const id of selectedUsers) {
        // eslint-disable-next-line no-await-in-loop
        await fetch(getApiUrl(`/api/admin/users/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      await fetchUsers();
      setSelectedUsers([]);
      setIsUserSelectMode(false);
      showToast(`${selectedUsers.length} user(s) deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting users:', error);
      showToast('Failed to delete users', 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/users/${editingUser.id}/role`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: editingUser.role,
          is_active: editingUser.is_active,
          group_id: editingUser.group_id
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
      
      await fetchUsers();
      setEditingUser(null);
      setIsUpdateUserModalOpen(false);
      showToast('User updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user', 'error');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user');
      }
      
      await fetchUsers();
      setIsAddingUser(false);
      setNewUser({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        email: '',
        role: 'student',
        group_id: '',
        password: ''
      });
      showToast('User added successfully', 'success');
    } catch (error) {
      console.error('Error adding user:', error);
      showToast('Failed to add user', 'error');
    }
  };

  // Group Management Handlers
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/api/admin/groups'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newGroup,
          budget_goal: parseFloat(newGroup.budget_goal),
          max_intra_loan_per_student: parseFloat(newGroup.max_intra_loan_per_student),
          max_inter_loan_limit: parseFloat(newGroup.max_inter_loan_limit),
          intra_loan_flat_fee: parseFloat(newGroup.intra_loan_flat_fee)
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create group');
      }
      
      await fetchGroups();
      setIsAddingGroup(false);
      setNewGroup({
        group_name: '',
        group_type: 'thesis',
        budget_goal: '0',
        max_intra_loan_per_student: '100',
        max_inter_loan_limit: '500',
        intra_loan_flat_fee: '10'
      });
      showToast('Group created successfully', 'success');
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Failed to create group', 'error');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const updateData = {
        group_name: editingGroup.group_name,
        group_type: editingGroup.group_type,
        budget_goal: parseFloat(editingGroup.budget_goal || '0'),
        max_intra_loan_per_student: parseFloat(editingGroup.max_intra_loan_per_student || '0'),
        max_inter_loan_limit: parseFloat(editingGroup.max_inter_loan_limit || '0'),
        intra_loan_flat_fee: parseFloat(editingGroup.intra_loan_flat_fee || '0')
      };
      
      const response = await fetch(getApiUrl(`/api/admin/groups/${editingGroup.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to update group: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      await fetchGroups();
      setEditingGroup(null);
      setIsUpdateGroupModalOpen(false);
      showToast('Group updated successfully', 'success');
    } catch (error) {
      console.error('Error updating group:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update group', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    
    try {
      setIsDeleteGroupModalOpen(false);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/groups/${groupToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete group');
      }
      
      await fetchGroups();
      setGroupToDelete(null);
      showToast('Group deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting group:', error);
      showToast('Failed to delete group', 'error');
    }
  };

  const handleMultiDeleteGroups = async () => {
    try {
      setIsMultiDeleteGroupModalOpen(false);
      const token = localStorage.getItem('token');
      
      const deletePromises = selectedGroups.map(groupId =>
        fetch(getApiUrl(`/api/admin/groups/${groupId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(async (response) => {
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete group');
          }
          return response;
        })
      );
      
      await Promise.all(deletePromises);
      await fetchGroups();
      setSelectedGroups([]);
      setIsGroupSelectMode(false);
      showToast(`Successfully deleted ${selectedGroups.length} group(s)`, 'success');
    } catch (error) {
      console.error('Error deleting groups:', error);
      showToast('Failed to delete some or all groups', 'error');
    }
  };

  const handleRegenerateGroupCode = async () => {
    if (!editingGroup) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(`/api/admin/groups/${editingGroup.id}/regenerate-code`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate group code');
      }
      
      const data = await response.json();
      setEditingGroup({ ...editingGroup, group_code: data.group_code });
      showToast('Group code regenerated successfully', 'success');
    } catch (error: unknown) {
      console.error('Error regenerating group code:', error);
      showToast(error instanceof Error ? error.message : 'Failed to regenerate group code', 'error');
    }
  };

  // When opening edit mode, properly initialize the form with group data
  const startEditingGroup = (group: Group) => {
    const editingGroupData: EditingGroup = {
      id: group.id,
      name: group.name,
      group_name: group.group_name || group.name || '',
      group_type: group.group_type || 'thesis',
      group_code: group.group_code,
      member_count: group.member_count,
      budget_goal: group.budget_goal.toString(),
      max_intra_loan_per_student: group.max_intra_loan_per_student.toString(),
      max_inter_loan_limit: group.max_inter_loan_limit.toString(),
      intra_loan_flat_fee: group.intra_loan_flat_fee.toString()
    };
    setEditingGroup(editingGroupData);
    setIsUpdateGroupModalOpen(true);
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
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => handleTabChange('thesis-weeks')}
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
                onClick={() => handleTabChange('users')}
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
                onClick={() => handleTabChange('groups')}
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
          {activeTab === 'thesis-weeks' && renderThesisWeeksTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'groups' && renderGroupsTab()}
        </div>
      </main>
    </div>
  );
};

export default Admin; 