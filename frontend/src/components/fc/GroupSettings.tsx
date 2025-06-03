import { useEffect, useState, useRef } from 'react';
import Navigation from '../layouts/Navigation';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { getApiUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import Cropper from 'react-easy-crop';
import Modal from '../ui/Modal';
import getCroppedImg from '../../utils/cropImage';

interface GroupData {
  id: number;
  group_name: string;
  group_type: string;
  budget_goal: number;
  max_intra_loan_per_student: number;
  max_inter_loan_limit: number;
  intra_loan_flat_fee: number;
  group_code: string;
}

interface EventTarget {
  name: string;
  value: string | number;
}

interface ChangeEvent {
  target: EventTarget;
}

interface GroupSettings {
  id: number;
  group_name: string;
  group_code: string;
  budget_goal: number;
  max_intra_loan_per_student: number;
  max_inter_loan_limit: number;
  intra_loan_flat_fee: number;
  gcash_qr_url?: string;
  maya_qr_url?: string;
}

interface CropCallback {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [qrUploading, setQrUploading] = useState(false);
  const [qrUploadError, setQrUploadError] = useState('');
  const [qrSuccess, setQrSuccess] = useState('');
  const [selectedQRType, setSelectedQRType] = useState<'gcash' | 'maya' | null>(null);
  const [selectedQRFile, setSelectedQRFile] = useState<File | null>(null);
  const [qrCropModalOpen, setQrCropModalOpen] = useState(false);
  const [qrCrop, setQrCrop] = useState({ x: 0, y: 0 });
  const [qrZoom, setQrZoom] = useState(1);
  const [qrCroppedAreaPixels, setQrCroppedAreaPixels] = useState<any>(null);
  const gcashInputRef = useRef<HTMLInputElement>(null);
  const mayaInputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (e: ChangeEvent) => {
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

  // Handle QR file select
  const handleQRFileChange = (type: 'gcash' | 'maya', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedQRType(type);
    setSelectedQRFile(file);
    setQrCropModalOpen(true);
    setQrUploadError('');
  };

  // Cropper callback
  const onQRCropComplete = (_: unknown, croppedAreaPixels: CropCallback) => {
    setQrCroppedAreaPixels(croppedAreaPixels);
  };

  // Upload cropped QR
  const handleCropAndUploadQR = async () => {
    if (!selectedQRFile || !qrCroppedAreaPixels || !settings) return;
    setQrUploading(true);
    setQrUploadError('');
    setQrSuccess('');
    try {
      const croppedBlob = await getCroppedImg(URL.createObjectURL(selectedQRFile), qrCroppedAreaPixels);
      const formData = new FormData();
      if (selectedQRType === 'gcash') formData.append('gcash_qr', croppedBlob, selectedQRFile.name);
      if (selectedQRType === 'maya') formData.append('maya_qr', croppedBlob, selectedQRFile.name);
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/api/groups/${settings.id}/qr`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload QR code');
      setSettings({ ...settings, gcash_qr_url: data.data.gcash_qr_url, maya_qr_url: data.data.maya_qr_url });
      setQrSuccess('QR code updated successfully!');
      showToast('QR code updated!', 'success');
      setQrCropModalOpen(false);
      setSelectedQRFile(null);
    } catch (err) {
      setQrUploadError(err instanceof Error ? err.message : 'Failed to upload QR code');
    } finally {
      setQrUploading(false);
    }
  };

  // Cancel crop/upload
  const handleCancelQRCrop = () => {
    setSelectedQRFile(null);
    setQrCroppedAreaPixels(null);
    setQrCropModalOpen(false);
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
        <Card className="p-8 bg-white dark:bg-neutral-800 shadow-lg mb-8">
          <form onSubmit={handleSave} className="space-y-6">
            {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">{error}</div>}
            {success && <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">{success}</div>}
            <Input
              id="group_name"
              name="group_name"
              label="Group Name"
              value={form.group_name}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
        {/* Payment QR Codes Section */}
        <Card className="p-8 bg-white dark:bg-neutral-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Payment QR Codes</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* GCash QR */}
            <div className="flex flex-col items-center">
              <span className="font-medium mb-2 text-neutral-800 dark:text-neutral-100">GCash QR</span>
              {settings?.gcash_qr_url ? (
                <img src={settings.gcash_qr_url} alt="GCash QR" className="w-32 h-32 rounded object-cover border mb-2" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded border mb-2">
                  <span className="text-neutral-400 dark:text-neutral-300 text-4xl">?</span>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => gcashInputRef.current?.click()}
                disabled={qrUploading}
                isLoading={qrUploading && selectedQRType === 'gcash'}
                loadingText="Uploading..."
              >
                {settings?.gcash_qr_url ? 'Change' : 'Upload'} GCash QR
              </Button>
              <input
                ref={gcashInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleQRFileChange('gcash', e)}
                disabled={qrUploading}
              />
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">Upload a 1:1 (square) QR code for GCash payments.</p>
              {qrUploadError && selectedQRType === 'gcash' && <div className="text-red-600 dark:text-red-400 text-xs mt-1">{qrUploadError}</div>}
              {qrSuccess && selectedQRType === 'gcash' && <div className="text-green-600 dark:text-green-400 text-xs mt-1">{qrSuccess}</div>}
            </div>
            {/* Maya QR */}
            <div className="flex flex-col items-center">
              <span className="font-medium mb-2 text-neutral-800 dark:text-neutral-100">Maya QR</span>
              {settings?.maya_qr_url ? (
                <img src={settings.maya_qr_url} alt="Maya QR" className="w-32 h-32 rounded object-cover border mb-2" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded border mb-2">
                  <span className="text-neutral-400 dark:text-neutral-300 text-4xl">?</span>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => mayaInputRef.current?.click()}
                disabled={qrUploading}
                isLoading={qrUploading && selectedQRType === 'maya'}
                loadingText="Uploading..."
              >
                {settings?.maya_qr_url ? 'Change' : 'Upload'} Maya QR
              </Button>
              <input
                ref={mayaInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleQRFileChange('maya', e)}
                disabled={qrUploading}
              />
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">Upload a 1:1 (square) QR code for Maya payments.</p>
              {qrUploadError && selectedQRType === 'maya' && <div className="text-red-600 dark:text-red-400 text-xs mt-1">{qrUploadError}</div>}
              {qrSuccess && selectedQRType === 'maya' && <div className="text-green-600 dark:text-green-400 text-xs mt-1">{qrSuccess}</div>}
            </div>
          </div>
        </Card>
        {/* QR Cropper Modal */}
        <Modal isOpen={qrCropModalOpen} onClose={handleCancelQRCrop} title={`Crop and Preview ${selectedQRType === 'gcash' ? 'GCash' : 'Maya'} QR`}>
          <div className="p-4 flex flex-col items-center bg-white dark:bg-neutral-900 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Crop and Preview {selectedQRType === 'gcash' ? 'GCash' : 'Maya'} QR</h2>
            <div className="relative w-64 h-64 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-700 shadow">
              {selectedQRFile && (
                <Cropper
                  image={URL.createObjectURL(selectedQRFile)}
                  crop={qrCrop}
                  zoom={qrZoom}
                  aspect={1}
                  onCropChange={setQrCrop}
                  onZoomChange={setQrZoom}
                  onCropComplete={onQRCropComplete}
                  cropShape="rect"
                  showGrid={false}
                />
              )}
            </div>
            <div className="w-full flex items-center gap-2 mt-4">
              <span className="text-xs text-gray-600 dark:text-gray-300">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={qrZoom}
                onChange={e => setQrZoom(Number(e.target.value))}
                className="flex-1 accent-primary-600"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">{qrZoom.toFixed(2)}x</span>
            </div>
            <div className="flex gap-2 mt-6 w-full">
              <Button className="flex-1" variant="primary" onClick={handleCropAndUploadQR} disabled={qrUploading} isLoading={qrUploading} loadingText="Uploading...">Save/Upload</Button>
              <Button className="flex-1" variant="secondary" onClick={handleCancelQRCrop} disabled={qrUploading}>Cancel</Button>
            </div>
            {qrUploading && <div className="mt-2 text-primary-600 dark:text-primary-400 font-medium">Uploading...</div>}
            {qrUploadError && <div className="mt-2 text-red-600 dark:text-red-400 font-medium">{qrUploadError}</div>}
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default GroupSettingsPage; 