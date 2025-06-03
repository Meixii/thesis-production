import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DashboardCard from '../dashboard/DashboardCard';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import ConfirmModal from '../ui/ConfirmModal';

interface ChecklistItem {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
}

interface ItemStatus {
  item_id: number;
  status: 'pending' | 'completed';
}

interface StudentStatus {
  user_id: number;
  user_name: string;
  item_statuses: ItemStatus[];
}

interface ChecklistDetails {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  items: ChecklistItem[];
  student_statuses: StudentStatus[];
}

const ChecklistDetails = () => {
  const { checklistId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistDetails | null>(null);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('user_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<{ [key: string]: boolean }>({});
  
  // Edit item state
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleteItemLoading, setDeleteItemLoading] = useState(false);

  // New batch update state
  const [batchUpdateLoading, setBatchUpdateLoading] = useState<boolean>(false);
  const [studentBatchLoading, setStudentBatchLoading] = useState<{[key: number]: boolean}>({});
  const [itemBatchLoading, setItemBatchLoading] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchChecklistDetails();
  }, [checklistId]);

  const fetchChecklistDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/checklists/${checklistId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch checklist details');
      }

      const data = await response.json();
      setChecklist(data.checklist);
    } catch (error) {
      showToast('Failed to load checklist details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      showToast('Item title is required', 'error');
      return;
    }

    setSubmitLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/checklists/${checklistId}/items`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add checklist item');
      }

      showToast('Checklist item added successfully', 'success');
      setAddItemModalOpen(false);
      setNewItemTitle('');
      setNewItemDescription('');
      
      // Refresh the details
      fetchChecklistDetails();
    } catch (error) {
      showToast('Failed to add checklist item', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: number, itemId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const loadingKey = `${userId}-${itemId}`;
    
    setStatusUpdateLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        getApiUrl(`/api/treasurer/checklists/${checklistId}/items/${itemId}/users/${userId}`),
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update the local state
      setChecklist(prevChecklist => {
        if (!prevChecklist) return null;
        
        const updatedStudentStatuses = prevChecklist.student_statuses.map(student => {
          if (student.user_id === userId) {
            const updatedItemStatuses = student.item_statuses.map(itemStatus => {
              if (itemStatus.item_id === itemId) {
                return { ...itemStatus, status: newStatus as 'pending' | 'completed' };
              }
              return itemStatus;
            });
            return { ...student, item_statuses: updatedItemStatuses };
          }
          return student;
        });
        
        return { ...prevChecklist, student_statuses: updatedStudentStatuses };
      });
      
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'error');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleEditItem = (item: ChecklistItem) => {
    setEditItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDescription(item.description || '');
    setEditItemModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editItemId) return;
    if (!editItemTitle.trim()) {
      showToast('Item title is required', 'error');
      return;
    }

    setEditLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/checklists/${checklistId}/items/${editItemId}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editItemTitle,
          description: editItemDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update checklist item');
      }

      // Update local state
      if (checklist) {
        const updatedItems = checklist.items.map(item => {
          if (item.id === editItemId) {
            return { 
              ...item, 
              title: editItemTitle,
              description: editItemDescription 
            };
          }
          return item;
        });
        
        setChecklist({
          ...checklist,
          items: updatedItems
        });
      }

      showToast('Checklist item updated successfully', 'success');
      setEditItemModalOpen(false);
    } catch (error) {
      showToast('Failed to update checklist item', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDeleteItemModal = (itemId: number) => {
    setDeleteItemId(itemId);
    setDeleteItemModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    
    setDeleteItemLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/checklists/${checklistId}/items/${deleteItemId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete checklist item');
      }

      // Update local state
      if (checklist) {
        const updatedItems = checklist.items.filter(item => item.id !== deleteItemId);
        
        setChecklist({
          ...checklist,
          items: updatedItems
        });
      }

      showToast('Checklist item deleted successfully', 'success');
      setDeleteItemModalOpen(false);
      
      // If all items are deleted, refresh to get the updated student statuses
      if (checklist && checklist.items.length <= 1) {
        fetchChecklistDetails();
      }
    } catch (error) {
      showToast('Failed to delete checklist item', 'error');
    } finally {
      setDeleteItemLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedStudents = () => {
    if (!checklist) return [];
    
    let students = [...checklist.student_statuses];
    
    students.sort((a, b) => {
      if (sortField === 'user_name') {
        // Get last names for sorting
        const getLastName = (fullName: string) => {
          const nameParts = fullName.split(' ');
          return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
        };
        
        const lastNameA = getLastName(a.user_name).toLowerCase();
        const lastNameB = getLastName(b.user_name).toLowerCase();
        
        return sortDirection === 'asc' 
          ? lastNameA.localeCompare(lastNameB)
          : lastNameB.localeCompare(lastNameA);
      }
      
      if (sortField === 'completion') {
        const completedA = a.item_statuses.filter(item => item.status === 'completed').length;
        const completedB = b.item_statuses.filter(item => item.status === 'completed').length;
        const percentA = (completedA / checklist.items.length) * 100;
        const percentB = (completedB / checklist.items.length) * 100;
        
        return sortDirection === 'asc' 
          ? percentA - percentB
          : percentB - percentA;
      }
      
      return 0;
    });
    
    return students;
  };

  const getCompletionPercentage = (student: StudentStatus) => {
    if (!checklist || checklist.items.length === 0) return 0;
    const completedItems = student.item_statuses.filter(item => item.status === 'completed').length;
    return Math.round((completedItems / checklist.items.length) * 100);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication required. Please log in again.', 'error');
        return;
      }
      
      // Create a temporary anchor element to handle the download with auth headers
      const link = document.createElement('a');
      link.href = getApiUrl(`/api/treasurer/checklists/${checklistId}/export`);
      link.setAttribute('download', `checklist_export.csv`);
      link.setAttribute('target', '_blank');
      
      // Create a fetch request with authentication
      const response = await fetch(link.href, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export: ' + response.statusText);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create object URL from blob
      const url = window.URL.createObjectURL(blob);
      
      // Set the link's href to the object URL
      link.href = url;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Export completed successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast(`Failed to export checklist: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Update the way student names are displayed
  // Handle cases where names might already start with a comma or have unusual formatting
  const formatStudentName = (fullName: string) => {
    // Log the input for debugging
    console.log("Original name:", fullName);
    
    // If name starts with a comma, it's likely already in "Last, First" format but with an error
    if (fullName.startsWith(',')) {
      // Remove leading comma and trim whitespace
      return fullName.substring(1).trim();
    }
    
    // Regular case: Convert "First Last" to "Last, First"
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) return fullName; // Return as is if can't be split properly
    
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts.slice(0, nameParts.length - 1).join(' ');
    
    // Log the output for debugging
    const result = `${lastName}, ${firstName}`;
    console.log("Formatted name:", result);
    
    return result;
  };

  // Handle checking all items for a specific student
  const handleCheckAllForStudent = async (userId: number) => {
    if (!checklist) return;
    
    setStudentBatchLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const promises = checklist.items.map(item => {
        const itemStatus = checklist.student_statuses
          .find(student => student.user_id === userId)?.item_statuses
          .find(status => status.item_id === item.id);
        
        // Only update items that aren't already completed
        if (itemStatus?.status !== 'completed') {
          return fetch(
            getApiUrl(`/api/treasurer/checklists/${checklistId}/items/${item.id}/users/${userId}`),
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'completed'
              })
            }
          );
        }
        return Promise.resolve(null);
      });
      
      await Promise.all(promises.filter(p => p !== null));
      
      // Update local state
      setChecklist(prevChecklist => {
        if (!prevChecklist) return null;
        
        const updatedStudentStatuses = prevChecklist.student_statuses.map(student => {
          if (student.user_id === userId) {
            const updatedItemStatuses = student.item_statuses.map(itemStatus => {
              return { ...itemStatus, status: 'completed' as 'pending' | 'completed' };
            });
            return { ...student, item_statuses: updatedItemStatuses };
          }
          return student;
        });
        
        return { ...prevChecklist, student_statuses: updatedStudentStatuses };
      });
      
      showToast('All items marked as completed for this student', 'success');
    } catch (error) {
      console.error('Error updating all items:', error);
      showToast('Failed to update all items', 'error');
    } finally {
      setStudentBatchLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Handle checking all students for a specific item
  const handleCheckAllForItem = async (itemId: number) => {
    if (!checklist) return;
    
    setItemBatchLoading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const promises = checklist.student_statuses.map(student => {
        const itemStatus = student.item_statuses.find(status => status.item_id === itemId);
        
        // Only update items that aren't already completed
        if (itemStatus?.status !== 'completed') {
          return fetch(
            getApiUrl(`/api/treasurer/checklists/${checklistId}/items/${itemId}/users/${student.user_id}`),
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'completed'
              })
            }
          );
        }
        return Promise.resolve(null);
      });
      
      await Promise.all(promises.filter(p => p !== null));
      
      // Update local state
      setChecklist(prevChecklist => {
        if (!prevChecklist) return null;
        
        const updatedStudentStatuses = prevChecklist.student_statuses.map(student => {
          const updatedItemStatuses = student.item_statuses.map(status => {
            if (status.item_id === itemId) {
              return { ...status, status: 'completed' as 'pending' | 'completed' };
            }
            return status;
          });
          return { ...student, item_statuses: updatedItemStatuses };
        });
        
        return { ...prevChecklist, student_statuses: updatedStudentStatuses };
      });
      
      showToast('All students marked as completed for this item', 'success');
    } catch (error) {
      console.error('Error updating all students:', error);
      showToast('Failed to update all students', 'error');
    } finally {
      setItemBatchLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Checklist not found</h2>
          <Button
            variant="primary"
            onClick={() => navigate('/treasurer/checklists')}
            className="mt-4"
          >
            Return to Checklists
          </Button>
        </div>
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
              {checklist.title}
            </h1>
            {checklist.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {checklist.description}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Due: {new Date(checklist.due_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => setAddItemModalOpen(true)}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/treasurer/checklists')}
            >
              Back to Checklists
            </Button>
          </div>
        </div>

        {/* Checklist Items */}
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Checklist Items
          </h2>
          {checklist.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No items in this checklist yet</p>
              <Button
                variant="primary"
                onClick={() => setAddItemModalOpen(true)}
              >
                Add First Item
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {checklist.items.map((item, index) => (
                <li key={item.id} className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Edit item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteItemModal(item.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Student Status Table */}
        {checklist.items.length > 0 && (
          <DashboardCard
            title="Student Progress"
            subtitle="Track student completion of checklist items"
          >
            <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0 z-20">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sticky left-0 bg-gray-50 dark:bg-neutral-800 z-30"
                      onClick={() => handleSort('user_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Student Name</span>
                        <SortIcon field="user_name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer sticky left-[196px] bg-gray-50 dark:bg-neutral-800 z-30"
                      onClick={() => handleSort('completion')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Completion</span>
                        <SortIcon field="completion" />
                      </div>
                    </th>
                    {checklist.items.map((item, index) => (
                      <th key={item.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-normal min-w-[120px] max-w-[150px]">
                        <div className="flex flex-col items-center">
                          <span className="text-center">{index + 1}. {item.title}</span>
                          <button
                            className="mt-2 text-xxs bg-primary-500 hover:bg-primary-600 text-white py-1 px-2 rounded-sm flex items-center justify-center text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleCheckAllForItem(item.id)}
                            disabled={itemBatchLoading[item.id]}
                          >
                            {itemBatchLoading[item.id] ? (
                              <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin mr-1"></div>
                            ) : (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Check All
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {getSortedStudents().map(student => (
                    <tr key={student.user_id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-neutral-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] group-hover:bg-gray-50 dark:group-hover:bg-neutral-800">
                        {formatStudentName(student.user_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap sticky left-[196px] bg-white dark:bg-neutral-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] group-hover:bg-gray-50 dark:group-hover:bg-neutral-800">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2 max-w-[100px]">
                              <div 
                                className="bg-primary-600 h-2.5 rounded-full" 
                                style={{ width: `${getCompletionPercentage(student)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getCompletionPercentage(student)}%
                            </span>
                          </div>
                          <button
                            className="mt-2 bg-primary-500 hover:bg-primary-600 text-white py-1 px-2 rounded-sm flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleCheckAllForStudent(student.user_id)}
                            disabled={studentBatchLoading[student.user_id]}
                          >
                            {studentBatchLoading[student.user_id] ? (
                              <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin mr-1"></div>
                            ) : (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Check All
                          </button>
                        </div>
                      </td>
                      {checklist.items.map(item => {
                        const itemStatus = student.item_statuses.find(
                          status => status.item_id === item.id
                        );
                        const status = itemStatus ? itemStatus.status : 'pending';
                        const loadingKey = `${student.user_id}-${item.id}`;
                        const isLoading = statusUpdateLoading[loadingKey] || false;
                        
                        return (
                          <td key={`${student.user_id}-${item.id}`} className="px-4 py-4 text-center">
                            <button
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isLoading 
                                  ? 'bg-gray-200 dark:bg-gray-700 cursor-wait' 
                                  : status === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                              onClick={() => !isLoading && handleUpdateStatus(student.user_id, item.id, status)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : status === 'completed' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        )}
      </main>

      {/* Add Item Modal */}
      <Modal
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        title="Add Checklist Item"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Item Title"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            required
            placeholder="e.g. Submit Resume"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Provide additional information about this item..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddItemModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAddItem}
              isLoading={submitLoading}
              loadingText="Adding..."
            >
              Add Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={editItemModalOpen}
        onClose={() => setEditItemModalOpen(false)}
        title="Edit Checklist Item"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Item Title"
            value={editItemTitle}
            onChange={(e) => setEditItemTitle(e.target.value)}
            required
            placeholder="e.g. Submit Resume"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              value={editItemDescription}
              onChange={(e) => setEditItemDescription(e.target.value)}
              placeholder="Provide additional information about this item..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditItemModalOpen(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={editLoading}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteItemModalOpen}
        onClose={() => setDeleteItemModalOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Checklist Item"
        message="Are you sure you want to delete this item? This action cannot be undone and all student progress for this item will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={deleteItemLoading}
      />
    </div>
  );
};

export default ChecklistDetails; 