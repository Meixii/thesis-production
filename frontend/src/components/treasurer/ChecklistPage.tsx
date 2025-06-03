import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Checklist {
  id: number;
  title: string;
  description: string | null;
  due_date: string;
  created_at: string;
  total_items: number;
  completed_items: number;
  items: ChecklistItem[];
}

const ChecklistPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newChecklist, setNewChecklist] = useState({
    title: '',
    description: '',
    due_date: '',
    items: [{ title: '', description: '' }]
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/checklists'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch checklists');
      }

      const data = await response.json();
      setChecklists(data.checklists);
    } catch (error) {
      showToast('Failed to load checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddItem = () => {
    setNewChecklist(prev => ({
      ...prev,
      items: [...prev.items, { title: '', description: '' }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setNewChecklist(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: 'title' | 'description', value: string) => {
    setNewChecklist(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const handleCreateChecklist = async () => {
    if (!newChecklist.title || !newChecklist.due_date) {
      showToast('Title and due date are required', 'error');
      return;
    }

    // Validate items
    const validItems = newChecklist.items.filter(item => item.title.trim() !== '');
    if (validItems.length === 0) {
      showToast('At least one checklist item is required', 'error');
      return;
    }

    setSubmitLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/checklists'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newChecklist.title,
          description: newChecklist.description,
          due_date: newChecklist.due_date,
          items: validItems
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checklist');
      }

      showToast('Checklist created successfully', 'success');
      setCreateModalOpen(false);
      setNewChecklist({
        title: '',
        description: '',
        due_date: '',
        items: [{ title: '', description: '' }]
      });
      
      // Refresh the list
      fetchChecklists();
    } catch (error) {
      showToast('Failed to create checklist', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (checklistId: number) => {
    setChecklistToDelete(checklistId);
    setDeleteModalOpen(true);
  };

  const handleDeleteChecklist = async () => {
    if (!checklistToDelete) return;
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/treasurer/checklists/${checklistToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete checklist');
      }

      showToast('Checklist deleted successfully', 'success');
      fetchChecklists();
    } catch (error) {
      showToast('Failed to delete checklist', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setChecklistToDelete(null);
    }
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
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
              Checklists
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Manage checklists and track student completion
            </p>
          </div>
          <div>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Checklist
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {checklists.length === 0 && (
          <Card className="p-6 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No checklists yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
              Create your first checklist to track student requirements and tasks.
            </p>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Checklist
            </Button>
          </Card>
        )}

        {/* Checklists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklists.map(checklist => (
            <Card 
              key={checklist.id} 
              className="p-6 flex flex-col transition-all hover:shadow-md"
            >
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {checklist.title}
                </h3>
                <button 
                  onClick={() => handleDeleteClick(checklist.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {checklist.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {checklist.description}
                </p>
              )}

              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Due Date
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(checklist.due_date).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {checklist.completed_items}/{checklist.total_items} items
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${getCompletionPercentage(checklist.completed_items, checklist.total_items)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/treasurer/checklists/${checklist.id}`)}
                  className="w-full"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Create Checklist Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Checklist"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newChecklist.title}
            onChange={(e) => setNewChecklist(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="e.g. OJT Requirements"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              value={newChecklist.description}
              onChange={(e) => setNewChecklist(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide additional information about this checklist..."
            />
          </div>
          
          <Input
            label="Due Date"
            type="date"
            value={newChecklist.due_date}
            onChange={(e) => setNewChecklist(prev => ({ ...prev, due_date: e.target.value }))}
            required
          />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Checklist Items
              </label>
              <Button
                variant="outline"
                className="text-xs py-1 px-2"
                onClick={handleAddItem}
              >
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {newChecklist.items.map((item, index) => (
                <div key={index} className="relative p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <Input
                    label="Item Title"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    placeholder="e.g. Submit Resume"
                    required
                  />
                  
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Item Description (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Provide additional details..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateChecklist}
              isLoading={submitLoading}
              loadingText="Creating..."
            >
              Create Checklist
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteChecklist}
        title="Delete Checklist"
        message="Are you sure you want to delete this checklist? This action cannot be undone. All items and student progress will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default ChecklistPage; 