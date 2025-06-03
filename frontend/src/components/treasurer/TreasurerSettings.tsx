import { useEffect, useState, useRef } from 'react';
import { getApiUrl } from '../../utils/api';
import Button from '../ui/Button';
import Cropper from 'react-easy-crop';
import Modal from '../ui/Modal';
import getCroppedImg from '../../utils/cropImage';
import { useToast } from '../../context/ToastContext';
import Navigation from '../layouts/Navigation';

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface GroupDetails {
  id: number;
  group_name: string;
  gcash_qr_url?: string;
  maya_qr_url?: string;
}

const TreasurerSettings = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
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
  const MEMBERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchGroupDetails();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/api/treasurer/members'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch members');
      setMembers(data.members);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to fetch members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/api/treasurer/group'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch group details');
      setGroupDetails(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to fetch group details', 'error');
    }
  };

  const handleQRFileChange = (type: 'gcash' | 'maya', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedQRType(type);
    setSelectedQRFile(file);
    setQrCropModalOpen(true);
    setQrUploadError('');
  };

  const onQRCropComplete = (_: any, croppedAreaPixels: any) => {
    setQrCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUploadQR = async () => {
    if (!selectedQRFile || !qrCroppedAreaPixels || !groupDetails) return;
    setQrUploading(true);
    setQrUploadError('');
    setQrSuccess('');
    try {
      const croppedBlob = await getCroppedImg(URL.createObjectURL(selectedQRFile), qrCroppedAreaPixels);
      const formData = new FormData();
      if (selectedQRType === 'gcash') formData.append('gcash_qr', croppedBlob, selectedQRFile.name);
      if (selectedQRType === 'maya') formData.append('maya_qr', croppedBlob, selectedQRFile.name);
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/api/groups/${groupDetails.id}/qr`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload QR code');
      setGroupDetails({ ...groupDetails, gcash_qr_url: data.data.gcash_qr_url, maya_qr_url: data.data.maya_qr_url });
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

  const handleCancelQRCrop = () => {
    setSelectedQRFile(null);
    setQrCroppedAreaPixels(null);
    setQrCropModalOpen(false);
  };

  const totalPages = Math.ceil(members.length / MEMBERS_PER_PAGE);
  const paginatedMembers = members.slice((currentPage - 1) * MEMBERS_PER_PAGE, currentPage * MEMBERS_PER_PAGE);

  const handleExport = () => {
    const csvHeader = 'Name,Email,Role\n';
    const csvRows = members.map(m => `${m.first_name} ${m.last_name},${m.email},${m.role.replace('_', ' ')}`).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'section_members.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAvatarUrl = (email: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundType=gradientLinear&fontWeight=700`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navigation userRole="treasurer" onLogout={() => { localStorage.clear(); window.location.href = '/login'; }} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Treasurer Settings</h1>
        {/* Section Members */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 p-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Section Members</h2>
              <span className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold px-2 py-1 rounded-full">{members.length}</span>
            </div>
            <Button variant="primary" onClick={handleExport} className="w-full sm:w-auto">Export</Button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-100 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {paginatedMembers.map(member => (
                    <tr key={member.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{member.first_name} {member.last_name}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-200">{member.email}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm capitalize text-neutral-600 dark:text-neutral-300">{member.role.replace('_', ' ')}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <Button variant="secondary" onClick={() => { setSelectedMember(member); setShowProfileModal(true); }}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</Button>
                <span className="text-sm text-neutral-700 dark:text-neutral-200">Page {currentPage} of {totalPages}</span>
                <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </div>
        {/* Payment QR Codes */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Payment QR Codes</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* GCash QR */}
            <div className="flex flex-col items-center">
              <span className="font-medium mb-2 text-neutral-800 dark:text-neutral-100">GCash QR</span>
              {groupDetails?.gcash_qr_url ? (
                <img src={groupDetails.gcash_qr_url} alt="GCash QR" className="w-32 h-32 rounded object-cover border mb-2" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded border mb-2">
                  <span className="text-neutral-400 dark:text-neutral-300 text-4xl">?</span>
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => gcashInputRef.current?.click()}
                disabled={qrUploading}
                isLoading={qrUploading && selectedQRType === 'gcash'}
                loadingText="Uploading..."
              >
                {groupDetails?.gcash_qr_url ? 'Change' : 'Upload'} GCash QR
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
              {groupDetails?.maya_qr_url ? (
                <img src={groupDetails.maya_qr_url} alt="Maya QR" className="w-32 h-32 rounded object-cover border mb-2" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 rounded border mb-2">
                  <span className="text-neutral-400 dark:text-neutral-300 text-4xl">?</span>
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => mayaInputRef.current?.click()}
                disabled={qrUploading}
                isLoading={qrUploading && selectedQRType === 'maya'}
                loadingText="Uploading..."
              >
                {groupDetails?.maya_qr_url ? 'Change' : 'Upload'} Maya QR
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
        </div>
        {/* Mini Profile Modal */}
        <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Member Profile">
          {selectedMember && (
            <div className="flex flex-col items-center p-6">
              <img
                src={getAvatarUrl(selectedMember.email)}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-4 border shadow"
              />
              <div className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{selectedMember.first_name} {selectedMember.last_name}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">{selectedMember.email}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{selectedMember.role.replace('_', ' ')}</div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default TreasurerSettings; 