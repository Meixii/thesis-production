import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../context/ToastContext';

const JoinGroupStep = () => {
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/student/join-group'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }
      showToast('Successfully joined group!', 'success');
      // Always redirect to /dashboard; router/guard will handle correct dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex flex-col justify-center items-center py-8 px-2">
      <Card variant="default" className="w-full max-w-md p-8 shadow-lg bg-white dark:bg-neutral-800">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Join a Group</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          To start using the app, you must join a group. Enter your group code below. If you don't have one, ask your Finance Coordinator or Section Treasurer.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="groupCode"
            name="groupCode"
            label="Group Code"
            value={groupCode}
            onChange={e => setGroupCode(e.target.value)}
            required
            autoFocus
          />
          {error && <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
          <Button type="submit" isLoading={loading} loadingText="Joining..." className="w-full">Join Group</Button>
        </form>
      </Card>
    </div>
  );
};

export default JoinGroupStep; 