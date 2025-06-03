import { useState } from 'react';
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
}

const CreateDueForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DueFormData>({
    title: '',
    description: '',
    total_amount_due: '',
    due_date: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/treasurer/dues'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          total_amount_due: parseFloat(formData.total_amount_due)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create due');
      }

      showToast('Due created successfully', 'success');
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
            Create a new due that will be assigned to all students in your section.
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