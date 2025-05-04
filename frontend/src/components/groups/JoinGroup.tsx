import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { getApiUrl } from '../../utils/api';

interface JoinGroupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinGroup: React.FC<JoinGroupProps> = ({ isOpen, onClose, onSuccess }) => {
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Send the group_code to the backend to join the group
      const response = await fetch(getApiUrl('/api/student/join-group'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupCode }) // Sending the group_code field
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Group"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Enter the group code provided by your Finance Coordinator to join a thesis group.
        </p>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-300">
              <span className="font-medium">Error:</span> {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="groupCode"
            name="groupCode"
            label="Group Code"
            labelClassName="text-gray-700 dark:text-gray-300"
            className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
            placeholder="Enter group code"
            required
          />

          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              loadingText="Joining..."
            >
              Join Group
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default JoinGroup; 