import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';

interface DueFormData {
  title: string;
  description: string;
  total_amount_due: string;
  due_date: string;
  payment_method_restriction: 'all' | 'online_only' | 'cash_only';
}

interface GroupMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const CreateDueForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DueFormData>({
    title: '',
    description: '',
    total_amount_due: '',
    due_date: '',
    payment_method_restriction: 'all'
  });
  
  // New state for targeted dues
  const [assignmentType, setAssignmentType] = useState<'all' | 'selected'>('all');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchGroupMembers();
  }, []);

  const fetchGroupMembers = async () => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/members'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch group members');
      }

      const data = await response.json();
      setGroupMembers(data.members);
    } catch (error) {
      showToast('Failed to load group members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssignmentTypeChange = (type: 'all' | 'selected') => {
    setAssignmentType(type);
    if (type === 'all') {
      setSelectedStudents(new Set());
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAllStudents = () => {
    const allStudentIds = new Set(groupMembers.map(member => member.id));
    setSelectedStudents(allStudentIds);
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare request body based on assignment type
      const requestBody = {
        ...formData,
        total_amount_due: parseFloat(formData.total_amount_due),
        assignment_type: assignmentType,
        ...(assignmentType === 'selected' && { selected_student_ids: Array.from(selectedStudents) })
      };

      const response = await fetch(getApiUrl('/api/treasurer/dues'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create due');
      }

      const result = await response.json();
      showToast(result.message || 'Due created successfully', 'success');
      navigate('/treasurer/dues');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create due', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="treasurer" onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Due</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create a new due and assign it to students in your section.
          </p>
        </div>

        <Card className="overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Input
                  label="Due Title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Class Materials Fee"
                  className="w-full"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a clear and descriptive title for the due.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                  placeholder="Provide a detailed description of what this due is for..."
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add any relevant details or instructions for the students.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Amount Due (₱)"
                    name="total_amount_due"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount_due}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    className="w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    The amount each student needs to pay.
                  </p>
                </div>

                <div>
                  <Input
                    label="Due Date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    The deadline for students to complete the payment.
                  </p>
                </div>
              </div>

              {/* Payment Method Restriction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method Restriction
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method_restriction"
                      value="all"
                      checked={formData.payment_method_restriction === 'all'}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method_restriction: e.target.value as 'all' | 'online_only' | 'cash_only' }))}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">All Payment Methods</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students can pay using GCash, Maya, or Cash</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method_restriction"
                      value="online_only"
                      checked={formData.payment_method_restriction === 'online_only'}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method_restriction: e.target.value as 'all' | 'online_only' | 'cash_only' }))}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Online Payment Only</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students can only pay using GCash or Maya</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment_method_restriction"
                      value="cash_only"
                      checked={formData.payment_method_restriction === 'cash_only'}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method_restriction: e.target.value as 'all' | 'online_only' | 'cash_only' }))}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Cash Only</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students can only pay using Cash</p>
                    </div>
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose which payment methods are allowed for this due.
                </p>
              </div>

              {/* Assignment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Assignment Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="all"
                      checked={assignmentType === 'all'}
                      onChange={() => handleAssignmentTypeChange('all')}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      All Students ({groupMembers.length} students)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="selected"
                      checked={assignmentType === 'selected'}
                      onChange={() => handleAssignmentTypeChange('selected')}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      Selected Students ({selectedStudents.size} selected)
                    </span>
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose whether to assign this due to all students or select specific students.
                </p>
              </div>

              {/* Student Selection */}
              {assignmentType === 'selected' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Students
                    </label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={selectAllStudents}
                        className="px-3 py-1 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={clearSelection}
                        className="px-3 py-1 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-700">
                      {groupMembers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No students found in your group
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {groupMembers.map((member) => (
                            <label
                              key={member.id}
                              className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(member.id)}
                                onChange={() => toggleStudentSelection(member.id)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.first_name} {member.last_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {member.email} • {member.role}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select the students who should be assigned this due.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/treasurer/dues')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                loadingText="Creating..."
                disabled={assignmentType === 'selected' && selectedStudents.size === 0}
              >
                Create Due
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateDueForm; 