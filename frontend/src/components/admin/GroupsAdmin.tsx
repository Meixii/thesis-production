import { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

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

const GroupsAdmin = () => {
  const { showToast } = useToast();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

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
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        } catch (parseError) {}
        throw new Error(errorMessage);
      }
      await fetchGroups();
      setEditingGroup(null);
      setIsUpdateGroupModalOpen(false);
      showToast('Group updated successfully', 'success');
    } catch (error) {
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
      showToast('Failed to delete some or all groups', 'error');
    }
  };

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
              <Button variant="outline" onClick={() => setIsGroupSelectMode(false)} className="border-gray-300 dark:border-gray-600">Cancel Selection</Button>
              <Button variant="secondary" onClick={() => setIsMultiDeleteGroupModalOpen(true)} disabled={selectedGroups.length === 0}>
                Delete Selected ({selectedGroups.length})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsGroupSelectMode(true)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Select Multiple</Button>
              <Button variant="primary" onClick={() => setIsAddingGroup(true)}>Add New Group</Button>
            </>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <input
          type="text"
          placeholder="Search groups by name or code..."
          value={groupSearchQuery}
          onChange={e => setGroupSearchQuery(e.target.value)}
          className="w-full sm:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
        />
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-x-auto border border-gray-200 dark:border-gray-700">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Budget Goal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Intra Loan Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inter Loan Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Flat Fee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Members</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
            {groups.filter(group => {
              const q = groupSearchQuery.toLowerCase();
              return (
                (group.group_name || group.name || '').toLowerCase().includes(q) ||
                (group.group_code || '').toLowerCase().includes(q)
              );
            }).length === 0 ? (
              <tr>
                <td colSpan={isGroupSelectMode ? 11 : 10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No groups found.
                </td>
              </tr>
            ) : (
              groups.filter(group => {
                const q = groupSearchQuery.toLowerCase();
                return (
                  (group.group_name || group.name || '').toLowerCase().includes(q) ||
                  (group.group_code || '').toLowerCase().includes(q)
                );
              }).map(group => (
                <tr key={group.id} className={selectedGroups.includes(group.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}>
                  {isGroupSelectMode && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => setSelectedGroups(prev => prev.includes(group.id) ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{group.group_name || group.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{group.group_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₱{group.budget_goal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₱{group.max_intra_loan_per_student.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₱{group.max_inter_loan_limit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₱{group.intra_loan_flat_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.group_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.member_count ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEditingGroup(group)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isGroupSelectMode}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setGroupToDelete(group.id); setIsDeleteGroupModalOpen(true); }}
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
      {(isAddingGroup || (editingGroup && isUpdateGroupModalOpen)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isAddingGroup ? 'Add New Group' : 'Edit Group'}
              </h3>
              <Button variant="outline" className="p-2 h-9 w-9 rounded-full border-gray-300 dark:border-gray-600" onClick={() => { setIsAddingGroup(false); setEditingGroup(null); setIsUpdateGroupModalOpen(false); }}>
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <form onSubmit={isAddingGroup ? handleAddGroup : handleUpdateGroup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                  <input type="text" name="group_name" value={isAddingGroup ? newGroup.group_name : editingGroup?.group_name || ''} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, group_name: e.target.value }) : setEditingGroup(editingGroup && { ...editingGroup, group_name: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Type</label>
                  <select name="group_type" value={isAddingGroup ? newGroup.group_type : editingGroup?.group_type || 'thesis'} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, group_type: e.target.value as 'thesis' | 'section' }) : setEditingGroup(editingGroup && { ...editingGroup, group_type: e.target.value as 'thesis' | 'section' })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400">
                    <option value="thesis">Thesis</option>
                    <option value="section">Section</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Goal (₱)</label>
                  <input type="number" min="0" step="0.01" name="budget_goal" value={isAddingGroup ? newGroup.budget_goal : editingGroup?.budget_goal || ''} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, budget_goal: e.target.value }) : setEditingGroup(editingGroup && { ...editingGroup, budget_goal: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intra Loan Limit (₱)</label>
                  <input type="number" min="0" step="0.01" name="max_intra_loan_per_student" value={isAddingGroup ? newGroup.max_intra_loan_per_student : editingGroup?.max_intra_loan_per_student || ''} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, max_intra_loan_per_student: e.target.value }) : setEditingGroup(editingGroup && { ...editingGroup, max_intra_loan_per_student: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inter Loan Limit (₱)</label>
                  <input type="number" min="0" step="0.01" name="max_inter_loan_limit" value={isAddingGroup ? newGroup.max_inter_loan_limit : editingGroup?.max_inter_loan_limit || ''} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, max_inter_loan_limit: e.target.value }) : setEditingGroup(editingGroup && { ...editingGroup, max_inter_loan_limit: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flat Fee (₱)</label>
                  <input type="number" min="0" step="0.01" name="intra_loan_flat_fee" value={isAddingGroup ? newGroup.intra_loan_flat_fee : editingGroup?.intra_loan_flat_fee || ''} onChange={e => isAddingGroup ? setNewGroup({ ...newGroup, intra_loan_flat_fee: e.target.value }) : setEditingGroup(editingGroup && { ...editingGroup, intra_loan_flat_fee: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" required />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => { setIsAddingGroup(false); setEditingGroup(null); setIsUpdateGroupModalOpen(false); }}>Cancel</Button>
                <Button variant="primary" type="submit">{isAddingGroup ? 'Add' : 'Update'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => setIsDeleteGroupModalOpen(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="secondary"
      />
      {/* Multi-Delete Groups Confirmation Modal */}
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

export default GroupsAdmin; 