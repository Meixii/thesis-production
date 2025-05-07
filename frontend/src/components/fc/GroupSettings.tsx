import { useEffect, useState } from 'react';
import Navigation from '../ui/Navigation';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface GroupSettings {
  id: number;
  group_name: string;
  group_code: string;
  budget_goal: number;
  max_intra_loan_per_student: number;
  max_inter_loan_limit: number;
  intra_loan_flat_fee: number;
}

const GroupSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [form, setForm] = useState({
    group_name: '',
    budget_goal: '',
    max_intra_loan_per_student: '',
    max_inter_loan_limit: '',
    intra_loan_flat_fee: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Get user profile to determine groupId
        const profileRes = await fetch(getApiUrl('/api/auth/profile'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        const groupId = profileData.groupId || profileData.data?.groupId || profileData.data?.group_id;
        if (!groupId) throw new Error('No group found for this user.');
        // Fetch group settings
        const groupRes = await fetch(getApiUrl(`/api/groups/${groupId}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const group = await groupRes.json();
        setSettings(group);
        setForm({
          group_name: group.group_name || '',
          budget_goal: group.budget_goal?.toString() || '',
          max_intra_loan_per_student: group.max_intra_loan_per_student?.toString() || '',
          max_inter_loan_limit: group.max_inter_loan_limit?.toString() || '',
          intra_loan_flat_fee: group.intra_loan_flat_fee?.toString() || ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!settings) throw new Error('No group loaded');
      const res = await fetch(getApiUrl(`/api/groups/${settings.id}/settings`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          group_name: form.group_name,
          budget_goal: parseFloat(form.budget_goal),
          max_intra_loan_per_student: parseFloat(form.max_intra_loan_per_student),
          max_inter_loan_limit: parseFloat(form.max_inter_loan_limit),
          intra_loan_flat_fee: parseFloat(form.intra_loan_flat_fee)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update group settings');
      setSettings(data.group);
      setSuccess('Group settings updated successfully!');
      showToast('Group settings updated successfully!', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group settings');
      showToast(err instanceof Error ? err.message : 'Failed to update group settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      <Navigation userRole="finance_coordinator" onLogout={() => {}} />
      <main className="max-w-xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Group Settings</h1>
        <Card className="p-8 bg-white dark:bg-neutral-800 shadow-lg">
          <form onSubmit={handleSave} className="space-y-6">
            {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">{error}</div>}
            {success && <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">{success}</div>}
            <Input
              id="group_name"
              name="group_name"
              label="Group Name"
              value={form.group_name}
              onChange={handleChange}
              required
            />
            <Input
              id="group_code"
              name="group_code"
              label="Group Code"
              value={settings?.group_code || ''}
              disabled
              helperText="Share this code with members to join your group."
            />
            <Input
              id="budget_goal"
              name="budget_goal"
              label="Budget Goal (PHP)"
              type="number"
              min="0"
              step="0.01"
              value={form.budget_goal}
              onChange={handleChange}
              required
              helperText="Total target amount for your group."
            />
            <Input
              id="max_intra_loan_per_student"
              name="max_intra_loan_per_student"
              label="Max Intra-Loan per Student (PHP)"
              type="number"
              min="0"
              step="0.01"
              value={form.max_intra_loan_per_student}
              onChange={handleChange}
              required
              helperText="Maximum amount a student can borrow from the group."
            />
            <Input
              id="max_inter_loan_limit"
              name="max_inter_loan_limit"
              label="Max Inter-Loan Limit (PHP)"
              type="number"
              min="0"
              step="0.01"
              value={form.max_inter_loan_limit}
              onChange={handleChange}
              required
              helperText="Maximum amount the group can lend or borrow from other groups."
            />
            <Input
              id="intra_loan_flat_fee"
              name="intra_loan_flat_fee"
              label="Intra-Loan Flat Fee (PHP)"
              type="number"
              min="0"
              step="0.01"
              value={form.intra_loan_flat_fee}
              onChange={handleChange}
              required
              helperText="Flat fee charged for each intra-group loan."
            />
            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" isLoading={saving} loadingText="Saving...">
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default GroupSettingsPage; 