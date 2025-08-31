import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

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
}

const UsersAdmin = () => {
  const { showToast } = useToast();
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
  const [newUser, setNewUser] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    email: '',
    role: 'student',
    group_id: '',
    password: ''
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  // Add a new state for tracking user password reset
  const [userToResetPassword, setUserToResetPassword] = useState<number | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
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
  }, [showToast]);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/admin/groups'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showToast('Failed to load groups', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [fetchUsers, fetchGroups]);

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
      for (const id of selectedUsers) {
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

  // Add a new handler for resetting user password
  const handleResetUserPassword = async () => {
    if (!userToResetPassword) return;
    try {
      setIsResetPasswordModalOpen(false);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/admin/users/${userToResetPassword}/reset-password`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset user password');
      }
      
      const data = await response.json();
      showToast(`Password reset successfully for ${data.email}`, 'success');
    } catch (error) {
      console.error('Error resetting user password:', error);
      showToast('Failed to reset user password', 'error');
    }
  };

  // Sorting helper
  const getSortedUsers = (usersToSort: User[]) => {
    const sorted = [...usersToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'group':
          aValue = a.group?.name?.toLowerCase() || '';
          bValue = b.group?.name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const q = userSearchQuery.toLowerCase();
    // Search filter
    const matchesSearch = user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    // Role filter
    let matchesRole = true;
    if (roleFilter === 'student') matchesRole = user.role === 'student';
    else if (roleFilter === 'treasurer') matchesRole = user.role === 'treasurer';
    else if (roleFilter === 'finance_coordinator') matchesRole = user.role === 'finance_coordinator';
    else if (roleFilter === 'admin') matchesRole = user.role === 'admin';
    else if (roleFilter === 'officers') matchesRole = ['treasurer', 'finance_coordinator', 'admin'].includes(user.role);
    // Group filter
    let matchesGroup = true;
    if (groupFilter !== 'all') matchesGroup = !!user.group && String(user.group.id) === groupFilter;
    return matchesSearch && matchesRole && matchesGroup;
  });
  const sortedUsers = getSortedUsers(filteredUsers);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage users, roles, and group assignments
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex space-x-2">
          {isUserSelectMode ? (
            <>
              <Button variant="outline" onClick={() => setIsUserSelectMode(false)} className="border-gray-300 dark:border-gray-600">Cancel Selection</Button>
              <Button variant="secondary" onClick={() => setIsMultiDeleteUserModalOpen(true)} disabled={selectedUsers.length === 0}>
                Delete Selected ({selectedUsers.length})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsUserSelectMode(true)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Select Multiple</Button>
              <Button variant="primary" onClick={() => setIsAddingUser(true)}>Add New User</Button>
            </>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={userSearchQuery}
            onChange={e => setUserSearchQuery(e.target.value)}
            className="w-full sm:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full sm:w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="treasurer">Treasurer</option>
            <option value="finance_coordinator">Finance Coordinator</option>
            <option value="admin">Admin</option>
            <option value="officers">Officers (Treasurer/FC/Admin)</option>
          </select>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="w-full sm:w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
          >
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.group_name || group.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-x-auto border border-gray-200 dark:border-gray-700">
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (sortColumn === 'name') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('name');
                    setSortDirection('asc');
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  Name
                  {sortColumn === 'name' && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (sortColumn === 'email') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('email');
                    setSortDirection('asc');
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  Email
                  {sortColumn === 'email' && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (sortColumn === 'role') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('role');
                    setSortDirection('asc');
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  Role
                  {sortColumn === 'role' && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (sortColumn === 'group') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('group');
                    setSortDirection('asc');
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  Group
                  {sortColumn === 'group' && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (sortColumn === 'status') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortColumn('status');
                    setSortDirection('asc');
                  }
                }}
              >
                <span className="flex items-center gap-1">
                  Status
                  {sortColumn === 'status' && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={isUserSelectMode ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              sortedUsers.map(user => (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}>
                  {isUserSelectMode && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          : user.role === 'finance_coordinator' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : user.role === 'treasurer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
                      `}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.group?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        const fullUser = users.find(u => u.id === user.id);
                        if (fullUser) {
                          setEditingUser(fullUser);
                          setIsUpdateUserModalOpen(true);
                        }
                      }}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUserSelectMode}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setUserToResetPassword(user.id); setIsResetPasswordModalOpen(true); }}
                      className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUserSelectMode}
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => { setUserToDelete(user.id); setIsDeleteUserModalOpen(true); }}
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
      {(isAddingUser || (editingUser && isUpdateUserModalOpen)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isAddingUser ? 'Add New User' : 'Edit User'}
              </h3>
              <Button variant="outline" className="p-2 h-9 w-9 rounded-full border-gray-300 dark:border-gray-600" onClick={() => { setIsAddingUser(false); setEditingUser(null); setIsUpdateUserModalOpen(false); }}>
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <form onSubmit={isAddingUser ? handleAddUser : handleUpdateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input type="text" name="first_name" value={isAddingUser ? newUser.first_name : editingUser?.first_name || ''} readOnly={!isAddingUser} onChange={e => isAddingUser ? setNewUser({ ...newUser, first_name: e.target.value }) : undefined} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input type="text" name="last_name" value={isAddingUser ? newUser.last_name : editingUser?.last_name || ''} readOnly={!isAddingUser} onChange={e => isAddingUser ? setNewUser({ ...newUser, last_name: e.target.value }) : undefined} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Middle Name</label>
                  <input type="text" name="middle_name" value={isAddingUser ? newUser.middle_name : editingUser?.middle_name || ''} readOnly={!isAddingUser} onChange={e => isAddingUser ? setNewUser({ ...newUser, middle_name: e.target.value }) : undefined} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suffix</label>
                  <input type="text" name="suffix" value={isAddingUser ? newUser.suffix : editingUser?.suffix || ''} readOnly={!isAddingUser} onChange={e => isAddingUser ? setNewUser({ ...newUser, suffix: e.target.value }) : undefined} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" name="email" value={isAddingUser ? newUser.email : editingUser?.email || ''} readOnly={!isAddingUser} onChange={e => isAddingUser ? setNewUser({ ...newUser, email: e.target.value }) : undefined} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <div className="flex gap-2 flex-wrap">
                    {['student', 'finance_coordinator', 'treasurer', 'admin'].map(roleOption => (
                      <button
                        key={roleOption}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                          (isAddingUser ? newUser.role : editingUser?.role) === roleOption
                            ? 'bg-primary-600 text-white border-primary-600 dark:bg-primary-400 dark:text-neutral-900'
                            : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-neutral-700 dark:text-gray-300 dark:border-neutral-600'
                        }`}
                        onClick={() => isAddingUser ? setNewUser({ ...newUser, role: roleOption }) : setEditingUser(editingUser && { ...editingUser, role: roleOption })}
                      >
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1).replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
                  <select name="group_id" value={isAddingUser ? newUser.group_id : editingUser?.group_id ?? ''} onChange={e => isAddingUser ? setNewUser({ ...newUser, group_id: e.target.value }) : setEditingUser(editingUser && { ...editingUser, group_id: e.target.value === '' ? null : Number(e.target.value) })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400">
                    <option value="">None</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.group_name || group.name}</option>
                    ))}
                  </select>
                </div>
                {isAddingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <input type="password" name="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => { setIsAddingUser(false); setEditingUser(null); setIsUpdateUserModalOpen(false); }}>Cancel</Button>
                <Button variant="primary" type="submit">{isAddingUser ? 'Add' : 'Update'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="secondary"
      />
      {/* Multi-Delete Users Confirmation Modal */}
      <ConfirmModal
        isOpen={isMultiDeleteUserModalOpen}
        onClose={() => setIsMultiDeleteUserModalOpen(false)}
        onConfirm={handleMultiDeleteUsers}
        title="Delete Multiple Users"
        message={`Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`}
        confirmText="Delete All"
        confirmVariant="secondary"
      />
      {/* Reset User Password Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onConfirm={handleResetUserPassword}
        title="Reset User Password"
        message="Are you sure you want to reset this user's password to the default value? The user will need to change their password after logging in."
        confirmText="Reset Password"
        confirmVariant="warning"
      />
    </div>
  );
};

export default UsersAdmin; 