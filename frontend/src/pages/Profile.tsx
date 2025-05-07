import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import Navigation from '../components/ui/Navigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import JoinGroup from '../components/groups/JoinGroup';
import { useToast } from '../context/ToastContext';
import Cropper from 'react-easy-crop';
import Modal from '../components/ui/Modal';
import getCroppedImg from '../utils/cropImage';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  profilePictureUrl?: string;
  role: string;
  groupId?: number;
  groupName?: string;
  groupType?: 'thesis' | 'section';
  emailVerified: boolean;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: ''
  });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Password validation rules
  const passwordRules = {
    minLength: 8,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < passwordRules.minLength) {
      errors.push(`Password must be at least ${passwordRules.minLength} characters long`);
    }
    if (!passwordRules.hasUpperCase.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!passwordRules.hasLowerCase.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!passwordRules.hasNumber.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!passwordRules.hasSpecialChar.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate new password
    if (name === 'newPassword') {
      const errors = validatePassword(value);
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: errors.length > 0 ? errors.join('. ') : ''
      }));
    }

    // Validate confirm password
    if (name === 'confirmPassword') {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: value !== passwordFormData.newPassword ? 'Passwords do not match' : ''
      }));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newPasswordErrors = validatePassword(passwordFormData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: newPasswordErrors.join('. ')
      }));
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/update-password'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      showToast('Password changed successfully!', 'success');
      setIsChangingPassword(false);
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(getApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile data');
        }

        // Try to extract profile data from different possible response structures
        let profileData: UserProfile;
        if (data.data) {
          profileData = data.data;
        } else if (data.user) {
          profileData = data.user;
        } else {
          profileData = data;
        }

        // Log the structure to help with debugging
        console.log('Profile data structure:', data);

        // Fetch group info if groupId exists
        if (profileData.groupId) {
          // If there's no group name already but we have a group ID, fetch the group details
            try {
              const groupResponse = await fetch(getApiUrl(`/api/groups/${profileData.groupId}`), {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (groupResponse.ok) {
                const groupData = await groupResponse.json();
                profileData.groupName = groupData.group_name || groupData.name || 'Group ' + profileData.groupId;
              profileData.groupType = groupData.group_type || groupData.groupType || 'thesis'; // default to thesis
              }
            } catch (groupErr) {
              console.error('Failed to fetch group details:', groupErr);
          }
        }

        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName || '',
          middleName: profileData.middleName || '',
          lastName: profileData.lastName || '',
          suffix: profileData.suffix || '',
          email: profileData.email || ''
        });
      } catch (err) {
        console.error('Profile error:', err);
        showToast(err instanceof Error ? err.message : 'Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/update-profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local profile state with new data
      if (profile) {
        setProfile({
          ...profile,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          suffix: formData.suffix
        });
      }

      setEditMode(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleJoinGroupSuccess = () => {
    showToast('Successfully joined group!', 'success');
    window.location.href = '/dashboard';
  };

  // const handleLeaveGroup = async () => {
  //   if (!confirm('Are you sure you want to leave your current group?')) {
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(getApiUrl('/api/student/leave-group'), {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to leave group');
  //     }

  //     // Update local profile state
  //     if (profile) {
  //       setProfile({
  //         ...profile,
  //         groupId: undefined,
  //         groupName: undefined
  //       });
  //     }

  //     showToast('Successfully left group', 'success');
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to leave group');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Generate Group Code for Finance Coordinators
  const handleGenerateGroupCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/groups/${profile?.groupId}/regenerate-code`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate new group code');
      }

      showToast('New group code generated successfully!', 'success');
      // Reload profile data to get updated group information
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate new group code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePicClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // When user selects a file, open crop modal
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCropModalOpen(true);
    setUploadError('');
  };

  // Called by cropper when crop area changes
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Crop and upload the image
  const handleCropAndUpload = async () => {
    if (!selectedFile || !croppedAreaPixels) return;
    setUploading(true);
    setUploadError('');
    try {
      // Crop the image to a blob
      const croppedBlob = await getCroppedImg(URL.createObjectURL(selectedFile), croppedAreaPixels);
      // Upload the cropped image
      const formData = new FormData();
      formData.append('profilePic', croppedBlob, selectedFile.name);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/auth/upload-profile-picture'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload profile picture');
      }
      // Update profile picture in state
      if (profile) {
        setProfile({ ...profile, profilePictureUrl: data.profilePictureUrl });
      }
      showToast('Profile picture updated!', 'success');
      setCropModalOpen(false);
      setSelectedFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Change image (reopen file picker)
  const handleChangeImage = () => {
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    setCropModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Cancel crop/upload
  const handleCancelCrop = () => {
    setSelectedFile(null);
    setCroppedAreaPixels(null);
    setCropModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine user role from profile
  const userRole = profile?.role?.toLowerCase() as 'student' | 'finance_coordinator' | 'treasurer' | 'admin';

  return (
    <div className="min-h-screen bg-background-secondary dark:bg-neutral-900">
      {/* Navigation should be full width and outside the main content container */}
      <Navigation onLogout={handleLogout} userRole={userRole} groupType={profile?.groupType} />

      {/* Main content container matches dashboard pages */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
          {/* Avatar with edit overlay */}
          <div className="relative flex-shrink-0 group">
            {profile?.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.firstName + ' avatar'}
                className="h-24 w-24 rounded-full object-cover border-4 border-primary-200 dark:border-primary-700 shadow-lg ring-2 ring-primary-400 dark:ring-primary-700 transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 dark:bg-primary-dark/20 flex items-center justify-center text-primary dark:text-primary-light text-4xl font-bold border-4 border-primary-200 dark:border-primary-700 shadow-lg ring-2 ring-primary-400 dark:ring-primary-700 transition-transform duration-200 group-hover:scale-105">
                {profile?.firstName?.[0] || ''}{profile?.lastName?.[0] || ''}
              </div>
            )}
            {/* Edit overlay for profile picture upload */}
            <button
              type="button"
              className="absolute bottom-2 right-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full p-1 shadow hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              title="Change profile picture"
              style={{ zIndex: 2 }}
              onClick={handleProfilePicClick}
              disabled={uploading}
            >
              {uploading ? (
                <svg className="w-5 h-5 animate-spin text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7l-1.5 1.5" />
                </svg>
              )}
            </button>
            {/* Hidden file input for profile picture */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfilePicChange}
              disabled={uploading}
            />
          </div>
          {/* Show upload error if any */}
          {uploadError && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{uploadError}</div>
          )}
          {/* Cropper Modal */}
          {cropModalOpen && selectedFile && (
            <Modal isOpen={cropModalOpen} onClose={handleCancelCrop} title="Crop and Preview Profile Picture">
              <div className="p-4 flex flex-col items-center bg-white dark:bg-neutral-900 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Crop and Preview Profile Picture</h2>
                {/* Cropper with border and shadow */}
                <div className="relative w-64 h-64 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-700 shadow">
                  <Cropper
                    image={URL.createObjectURL(selectedFile)}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="round"
                    showGrid={false}
                  />
                </div>
                {/* Zoom slider */}
                <div className="w-full flex items-center gap-2 mt-4">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="flex-1 accent-primary-600"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{zoom.toFixed(2)}x</span>
                </div>
                {/* Buttons */}
                <div className="flex gap-4 mt-6 w-full">
                  <button className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white rounded font-semibold transition-colors" onClick={handleCropAndUpload} disabled={uploading}>Save/Upload</button>
                  <button className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 focus:bg-gray-300 dark:focus:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded font-semibold transition-colors" onClick={handleChangeImage} disabled={uploading}>Change Image</button>
                  <button className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 focus:bg-red-600 text-white rounded font-semibold transition-colors" onClick={handleCancelCrop} disabled={uploading}>Cancel</button>
                </div>
                {/* Status/Error messages */}
                {uploading && <div className="mt-2 text-primary-600 dark:text-primary-400 font-medium">Uploading...</div>}
                {uploadError && <div className="mt-2 text-red-600 dark:text-red-400 font-medium">{uploadError}</div>}
              </div>
            </Modal>
          )}
          {/* Name and Role */}
          <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile?.firstName} {profile?.middleName} {profile?.lastName} {profile?.suffix}
          </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ml-0 sm:ml-3 ${
                userRole === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                userRole === 'treasurer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                userRole === 'finance_coordinator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {userRole === 'finance_coordinator' ? 'Finance Coordinator' :
                 userRole === 'treasurer' ? 'Treasurer' :
                 userRole === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-base">
              {profile?.email}
          </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info Card */}
            <Card variant="default" className="bg-white dark:bg-neutral-800 shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                    {profile?.emailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Unverified
                      </span>
                    )}
                  </div>
                  <Button
                    variant={editMode ? "outline" : "primary"}
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2"
                  >
                    {editMode ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M6.8 21h3.4a1 1 0 00.8-.4l9.6-12a1 1 0 000-1.2l-2.8-3.6a1 1 0 00-1.2 0l-9.6 12a1 1 0 00-.2.6v3.4a1 1 0 001 1z" />
                        </svg>
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                {editMode ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input id="firstName" name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required />
                      <Input id="middleName" name="middleName" label="Middle Name" value={formData.middleName} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input id="lastName" name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required />
                      <Input id="suffix" name="suffix" label="Suffix" value={formData.suffix} onChange={handleInputChange} placeholder="e.g., Jr., Sr., III" />
                    </div>
                    <Input id="email" name="email" type="email" label="Email Address" value={formData.email} onChange={handleInputChange} disabled helperText="Email cannot be changed" />
                    <div className="pt-4 flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                      <Button type="submit" variant="primary" isLoading={saving} loadingText="Saving...">Save Changes</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Basic Info - Changed to single column layout */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Full Name</h3>
                        <p className="text-base font-medium text-neutral-900 dark:text-white">
                          {profile?.firstName} {profile?.middleName} {profile?.lastName} {profile?.suffix}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Email</h3>
                        <p className="text-base font-medium text-neutral-900 dark:text-white">{profile?.email}</p>
                      </div>
                    </div>

                    {/* Role & Group Info - Added text-center */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-1 text-center">
                          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Role</h3>
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                              ${userRole === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : userRole === 'finance_coordinator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : userRole === 'treasurer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
                            >
                              {userRole === 'finance_coordinator' ? 'Finance Coordinator'
                                : userRole === 'treasurer' ? 'Treasurer'
                                : userRole === 'admin' ? 'Admin'
                                : 'Student'}
                            </span>
                          </div>
                        </div>
                        {profile?.groupId && (
                          <div className="space-y-1 text-center">
                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Group</h3>
                            <div className="flex items-center justify-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                ${profile.groupType === 'section' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}
                              >
                                {profile.groupName}
                                {profile.groupType === 'section' ? ' (Section)' : ' (Thesis)'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role-specific Info Box */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      {userRole === 'finance_coordinator' ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-3">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            As the Finance Coordinator, you manage this group's financial activities and member access.
                          </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button variant="primary" className="text-sm px-3 py-1.5" onClick={handleGenerateGroupCode}>Generate New Group Code</Button>
                                <Button variant="outline" className="text-sm px-3 py-1.5" onClick={() => navigate('/dashboard/fc')}>View Group Dashboard</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : profile?.groupType === 'section' ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                Your dues and payments are managed by your Treasurer. You can view and pay your assigned dues in Dashboard.
                              </p>
                              <div className="mt-3">
                                <Button variant="primary" className="text-sm px-3 py-1.5" onClick={() => navigate('/dashboard/section')}>View My Dues</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : userRole === 'student' ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-3">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            You are currently a member of this group. All your financial contributions and loans are associated with this group.
                          </p>
                              <div className="mt-3">
                                <Button variant="primary" className="text-sm px-3 py-1.5" onClick={() => navigate('/dashboard/student')}>View My Dashboard</Button>
                        </div>
                        </div>
                  </div>
                        </div>
                      ) : userRole === 'admin' ? (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        <div className="ml-3">
                              <p className="text-sm text-red-800 dark:text-red-300">
                                As an admin, you have full access to manage all groups and users in the system.
                              </p>
                              <div className="mt-3">
                                <Button variant="primary" className="text-sm px-3 py-1.5" onClick={() => navigate('/admin')}>Go to Admin Dashboard</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </Card>

          {/* Password Change Card */}
          <Card variant="default" className="bg-white dark:bg-neutral-800 shadow-sm">
                <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Settings</h2>
                <Button variant={isChangingPassword ? "outline" : "primary"} onClick={() => setIsChangingPassword(!isChangingPassword)}>{isChangingPassword ? 'Cancel' : 'Change Password'}</Button>
              </div>
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input type="password" name="currentPassword" label="Current Password" value={passwordFormData.currentPassword} onChange={handlePasswordChange} required />
                  <Input type="password" name="newPassword" label="New Password" value={passwordFormData.newPassword} onChange={handlePasswordChange} error={passwordErrors.newPassword} required />
                  <Input type="password" name="confirmPassword" label="Confirm New Password" value={passwordFormData.confirmPassword} onChange={handlePasswordChange} error={passwordErrors.confirmPassword} required />
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-700/30 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Password Requirements:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li className={`flex items-center ${passwordFormData.newPassword.length >= passwordRules.minLength ? 'text-green-600 dark:text-green-400' : ''}`}><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordFormData.newPassword.length >= passwordRules.minLength ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>At least {passwordRules.minLength} characters long</li>
                      <li className={`flex items-center ${passwordRules.hasUpperCase.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordRules.hasUpperCase.test(passwordFormData.newPassword) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>One uppercase letter</li>
                      <li className={`flex items-center ${passwordRules.hasLowerCase.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordRules.hasLowerCase.test(passwordFormData.newPassword) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>One lowercase letter</li>
                      <li className={`flex items-center ${passwordRules.hasNumber.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordRules.hasNumber.test(passwordFormData.newPassword) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>One number</li>
                      <li className={`flex items-center ${passwordRules.hasSpecialChar.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={passwordRules.hasSpecialChar.test(passwordFormData.newPassword) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>One special character</li>
                    </ul>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit" 
                      variant="primary" 
                      isLoading={saving} 
                      loadingText="Changing Password..." 
                      disabled={
                        !passwordFormData.currentPassword ||
                        !passwordFormData.newPassword ||
                        !passwordFormData.confirmPassword ||
                        Boolean(passwordErrors.newPassword) ||
                        Boolean(passwordErrors.confirmPassword) ||
                        passwordFormData.newPassword !== passwordFormData.confirmPassword
                      }
                    >
                      Change Password
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">Secure your account by regularly updating your password.</p>
              )}
                </div>
              </Card>
        </div>
      </main>

      {/* Join Group Modal */}
      <JoinGroup
        isOpen={joinGroupModalOpen}
        onClose={() => setJoinGroupModalOpen(false)}
        onSuccess={handleJoinGroupSuccess}
      />
    </div>
  );
};

export default Profile;