// This is the WeeksAdmin component

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

interface ThesisWeek {
  id?: number;
  week_number: number;
  start_date: string;
  end_date: string;
  group_id?: number;
  group_name?: string;
}

interface Group {
  id: number;
  name?: string;
  group_name: string;
}

// Utility function to format date as yyyy-mm-dd
function formatDateYYYYMMDD(date: string | Date): string {
  if (!date) return '';
  if (typeof date === 'string') {
    // If already in yyyy-mm-dd, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // If ISO string (yyyy-mm-ddTHH:MM:SS.sssZ), split at T
    if (/^\d{4}-\d{2}-\d{2}T/.test(date)) return date.split('T')[0];
    // Otherwise, fallback: try to parse as Date, but avoid timezone shift
    return date;
  }
  // If Date object, format as yyyy-mm-dd in local time
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format yyyy-mm-dd or ISO string as M/D/YYYY
function formatDateMDY(dateStr: string): string {
  if (!dateStr) return '';
  // Handles both 'yyyy-mm-dd' and 'yyyy-mm-ddTHH:MM:SS.sssZ'
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
}

const WeeksAdmin = () => {
  const { showToast } = useToast();
  const [weeks, setWeeks] = useState<ThesisWeek[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingWeeks, setIsAddingWeeks] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ThesisWeek | null>(null);
  const [weekToDelete, setWeekToDelete] = useState<number | null>(null);
  const [isDeleteWeekModalOpen, setIsDeleteWeekModalOpen] = useState(false);
  const [isUpdateWeekModalOpen, setIsUpdateWeekModalOpen] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [isWeekSelectMode, setIsWeekSelectMode] = useState(false);
  const [isMultiDeleteWeekModalOpen, setIsMultiDeleteWeekModalOpen] = useState(false);
  const [newWeeks, setNewWeeks] = useState<ThesisWeek[]>([{
    week_number: 1,
    start_date: '',
    end_date: ''
  }]);
  const [originalEditingWeek, setOriginalEditingWeek] = useState<ThesisWeek | null>(null);
  const [isUpdatingWeek, setIsUpdatingWeek] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/admin/groups'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data.groups || []);
      if (data.groups && data.groups.length > 0) {
        setSelectedGroupId(0); // Default to 'All Groups'
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      showToast('Failed to load groups', 'error');
    }
  }, [showToast]);

  const fetchWeeks = useCallback(async (groupId?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = getApiUrl('/api/admin/thesis-weeks');
      if (groupId && groupId !== 0) {
        url += `?group_id=${groupId}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch thesis weeks');
      }
      const data = await response.json();
      setWeeks(data.thesis_weeks || []);
    } catch (error) {
      console.error('Error fetching thesis weeks:', error);
      showToast('Failed to load thesis weeks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroupId === 0) {
      fetchWeeks(); // All groups
    } else if (selectedGroupId !== null) {
      fetchWeeks(selectedGroupId);
    }
  }, [selectedGroupId, fetchWeeks]);

  const handleAddWeeks = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent submission if any week has no valid group_id
    if (newWeeks.some(week => !week.group_id || isNaN(Number(week.group_id)))) {
      showToast('Please select a valid group for all weeks', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const addPromises = newWeeks.map(week => 
        fetch(getApiUrl('/api/admin/thesis-weeks'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...week, group_id: Number(week.group_id) })
        })
      );

      const responses = await Promise.all(addPromises);
      
      // Check if all responses are ok
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error('Failed to add some thesis weeks');
      }

      await fetchWeeks(selectedGroupId!);
      setIsAddingWeeks(false);
      setNewWeeks([{
        week_number: (weeks.length > 0 ? Math.max(...weeks.map(w => w.week_number)) : 1),
        start_date: '',
        end_date: ''
      }]);
      showToast(`Successfully added ${newWeeks.length} thesis week(s)`, 'success');
    } catch (error) {
      console.error('Error adding thesis weeks:', error);
      showToast('Failed to add thesis weeks', 'error');
    }
  };

  const handleUpdateWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeek) return;
    // Validation
    if (!editingWeek.week_number || !editingWeek.start_date || !editingWeek.end_date || !editingWeek.group_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      setIsUpdatingWeek(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/admin/thesis-weeks/${editingWeek.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...editingWeek, group_id: editingWeek.group_id })
      });
      if (!response.ok) {
        throw new Error('Failed to update thesis week');
      }
      await fetchWeeks(selectedGroupId!);
      setEditingWeek(null);
      setOriginalEditingWeek(null);
      setIsUpdateWeekModalOpen(false);
      showToast('Thesis week updated successfully', 'success');
    } catch (error) {
      console.error('Error updating thesis week:', error);
      showToast('Failed to update thesis week', 'error');
    } finally {
      setIsUpdatingWeek(false);
    }
  };

  const handleDeleteWeek = async () => {
    if (!weekToDelete) return;
    try {
      setIsDeleteWeekModalOpen(false);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/admin/thesis-weeks/${weekToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete thesis week');
      }
      await fetchWeeks(selectedGroupId!);
      setWeekToDelete(null);
      showToast('Thesis week deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting thesis week:', error);
      showToast('Failed to delete thesis week', 'error');
    }
  };

  const handleMultiDeleteWeeks = async () => {
    try {
      setIsMultiDeleteWeekModalOpen(false);
      const token = localStorage.getItem('token');
      const deletePromises = selectedWeeks.map(weekId =>
        fetch(getApiUrl(`/api/admin/thesis-weeks/${weekId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );
      const responses = await Promise.all(deletePromises);
      
      // Check if all responses are ok
      const failedResponses = responses.filter(response => !response.ok);
      if (failedResponses.length > 0) {
        throw new Error('Failed to delete some thesis weeks');
      }

      await fetchWeeks(selectedGroupId!);
      setSelectedWeeks([]);
      setIsWeekSelectMode(false);
      showToast(`Successfully deleted ${selectedWeeks.length} thesis week(s)`, 'success');
    } catch (error) {
      console.error('Error deleting thesis weeks:', error);
      showToast('Failed to delete thesis weeks', 'error');
    }
  };

  const addNewWeekRow = () => {
    const lastWeekNumber = newWeeks.length > 0 
      ? Math.max(...newWeeks.map(w => w.week_number)) 
      : (weeks.length > 0 ? Math.max(...weeks.map(w => w.week_number)) : 0);
    
    setNewWeeks([...newWeeks, {
      week_number: lastWeekNumber + 1,
      start_date: '',
      end_date: ''
    }]);
  };

  const updateNewWeek = (index: number, updates: Partial<ThesisWeek>) => {
    const updatedWeeks = [...newWeeks];
    updatedWeeks[index] = { ...updatedWeeks[index], ...updates };
    setNewWeeks(updatedWeeks);
  };

  // const removeNewWeek = (index: number) => {
  //   const updatedWeeks = newWeeks.filter((_, i) => i !== index);
  //   setNewWeeks(updatedWeeks);
  // };

  const suggestNextWeek = useCallback(() => {
    // If no existing weeks, start from the current week
    if (weeks.length === 0) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Saturday
      return {
        week_number: 1,
        start_date: formatDateYYYYMMDD(startOfWeek),
        end_date: formatDateYYYYMMDD(endOfWeek)
      };
    }
    // Find the last week and increment
    const lastWeek = weeks.reduce((max, week) => 
      week.week_number > max.week_number ? week : max
    );
    const lastEndDate = new Date(lastWeek.end_date);
    const nextStartDate = new Date(lastEndDate);
    nextStartDate.setDate(lastEndDate.getDate() + 1); // Start from the day after last week's end
    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setDate(nextStartDate.getDate() + 6); // 7 days period
    return {
      week_number: lastWeek.week_number + 1,
      start_date: formatDateYYYYMMDD(nextStartDate),
      end_date: formatDateYYYYMMDD(nextEndDate)
    };
  }, [weeks]);

  useEffect(() => {
    // When weeks are loaded, update newWeeks with suggested next week
    if (weeks.length > 0) {
      setNewWeeks([suggestNextWeek()]);
    }
  }, [weeks, suggestNextWeek]);

  useEffect(() => {
    if (weeks.length > 0) {
      console.log('Fetched weeks:', weeks);
    }
  }, [weeks]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Thesis Weeks Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Configure and manage thesis weeks for the current period
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
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Thesis Weeks Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Configure and manage thesis weeks for the current period
          </p>
        </div>
        <div className="flex space-x-2">
          {isWeekSelectMode ? (
            <>
              <Button variant="outline" onClick={() => setIsWeekSelectMode(false)} className="border-gray-300 dark:border-gray-600">Cancel Selection</Button>
              <Button variant="secondary" onClick={() => setIsMultiDeleteWeekModalOpen(true)} disabled={selectedWeeks.length === 0}>
                Delete Selected ({selectedWeeks.length})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsWeekSelectMode(true)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Select Multiple</Button>
              <Button variant="primary" onClick={() => setIsAddingWeeks(true)}>Add New Weeks</Button>
            </>
          )}
        </div>
      </div>
      {/* Group Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Group</label>
        <select
          value={selectedGroupId ?? 0}
          onChange={e => setSelectedGroupId(Number(e.target.value))}
          className="w-full sm:w-64 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
        >
          <option value={0}>All Groups</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.group_name || group.name}</option>
          ))}
        </select>
      </div>
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-x-auto border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-neutral-700">
            <tr>
              {isWeekSelectMode && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedWeeks.length > 0 && selectedWeeks.length === weeks.length}
                      onChange={() => {
                        if (selectedWeeks.length === weeks.length) {
                          setSelectedWeeks([]);
                        } else {
                          setSelectedWeeks(weeks.map(week => week.id!));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                    />
                    <span className="ml-2">Select All</span>
                  </div>
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Week Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Group</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
            {weeks.length === 0 ? (
              <tr>
                <td colSpan={isWeekSelectMode ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No thesis weeks found for this group.
                </td>
              </tr>
            ) : (
              weeks.map(week => (
              <tr key={week.id} className={selectedWeeks.includes(week.id!) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}>
                {isWeekSelectMode && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={selectedWeeks.includes(week.id!)}
                      onChange={() => setSelectedWeeks(prev => 
                        prev.includes(week.id!) 
                          ? prev.filter(id => id !== week.id!) 
                          : [...prev, week.id!]
                      )}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-neutral-700"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {week.week_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDateMDY(week.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDateMDY(week.end_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {week.group_name || groups.find(g => g.id === week.group_id)?.group_name || groups.find(g => g.id === week.group_id)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                        const weekCopy = {
                          ...week,
                          start_date: formatDateYYYYMMDD(week.start_date),
                          end_date: formatDateYYYYMMDD(week.end_date)
                        };
                        setEditingWeek(weekCopy);
                        setOriginalEditingWeek({ ...weekCopy });
                      setIsUpdateWeekModalOpen(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isWeekSelectMode}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { 
                      setWeekToDelete(week.id!); 
                      setIsDeleteWeekModalOpen(true); 
                    }}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isWeekSelectMode}
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

      {/* Add Weeks Modal */}
      {isAddingWeeks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Thesis Weeks
              </h3>
              <Button 
                variant="outline" 
                className="p-2 h-9 w-9 rounded-full border-gray-300 dark:border-gray-600" 
                onClick={() => { 
                  setIsAddingWeeks(false); 
                  setNewWeeks([{
                    week_number: (weeks.length > 0 ? Math.max(...weeks.map(w => w.week_number)) + 1 : 1),
                    start_date: '',
                    end_date: ''
                  }]); 
                }}
              >
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <form onSubmit={handleAddWeeks} className="space-y-6">
              <div className="space-y-6">
                {newWeeks.map((week, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Week Number</label>
                      <input 
                        type="number" 
                        value={week.week_number} 
                        onChange={(e) => updateNewWeek(index, { week_number: parseInt(e.target.value) })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={week.start_date} 
                        onChange={(e) => updateNewWeek(index, { start_date: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                        required 
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <input 
                          type="date" 
                          value={week.end_date} 
                          onChange={(e) => updateNewWeek(index, { end_date: e.target.value })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                          required 
                        />
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
                      <select
                        value={week.group_id ?? ''}
                        onChange={e => updateNewWeek(index, { group_id: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                        required
                      >
                        <option value="">Select Group</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.group_name || group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addNewWeekRow}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 w-full sm:w-auto"
                >
                  Add Another Week
                </Button>
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => { 
                      setIsAddingWeeks(false); 
                      setNewWeeks([{
                        week_number: (weeks.length > 0 ? Math.max(...weeks.map(w => w.week_number)) + 1 : 1),
                        start_date: '',
                        end_date: ''
                      }]); 
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="w-full sm:w-auto">Add Weeks</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Week Modal */}
      {editingWeek && isUpdateWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Thesis Week
              </h3>
              <Button 
                variant="outline" 
                className="p-2 h-9 w-9 rounded-full border-gray-300 dark:border-gray-600" 
                onClick={() => { 
                  setEditingWeek(null); 
                  setIsUpdateWeekModalOpen(false); 
                }}
              >
                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <form onSubmit={handleUpdateWeek} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Week Number</label>
                  <input 
                    type="number" 
                    value={editingWeek.week_number} 
                    onChange={e => setEditingWeek({ ...editingWeek, week_number: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={formatDateYYYYMMDD(editingWeek.start_date)} 
                    onChange={e => setEditingWeek({ ...editingWeek, start_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={formatDateYYYYMMDD(editingWeek.end_date)} 
                    onChange={e => setEditingWeek({ ...editingWeek, end_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
                  <select
                    value={editingWeek.group_id ?? selectedGroupId ?? ''}
                    onChange={e => setEditingWeek({ ...editingWeek, group_id: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.group_name || group.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => originalEditingWeek && setEditingWeek({ ...originalEditingWeek, start_date: formatDateYYYYMMDD(originalEditingWeek.start_date), end_date: formatDateYYYYMMDD(originalEditingWeek.end_date) })}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Reset
                </Button>
                <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => { 
                    setEditingWeek(null); 
                    setIsUpdateWeekModalOpen(false); 
                  }}
                >
                  Cancel
                </Button>
                  <Button type="submit" variant="primary" isLoading={isUpdatingWeek} loadingText="Updating...">Update</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Week Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteWeekModalOpen}
        onClose={() => setIsDeleteWeekModalOpen(false)}
        onConfirm={handleDeleteWeek}
        title="Delete Thesis Week"
        message="Are you sure you want to delete this thesis week? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="secondary"
      />

      {/* Multi-Delete Weeks Confirmation Modal */}
      <ConfirmModal
        isOpen={isMultiDeleteWeekModalOpen}
        onClose={() => setIsMultiDeleteWeekModalOpen(false)}
        onConfirm={handleMultiDeleteWeeks}
        title="Delete Multiple Thesis Weeks"
        message={`Are you sure you want to delete ${selectedWeeks.length} selected thesis week(s)? This action cannot be undone.`}
        confirmText="Delete All"
        confirmVariant="secondary"
      />
    </div>
  );
};

export default WeeksAdmin;

