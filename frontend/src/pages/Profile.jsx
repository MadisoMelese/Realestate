import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, uploadProfileImage, changePassword } from '../redux/slices/authSlice';
import { getImageUrl } from '../utils/imageUrl';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bank account state
  const [bankData, setBankData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    instructions: '',
  });
  const [isBankEditing, setIsBankEditing] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankSuccess, setBankSuccess] = useState('');

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Sync form when user data loads (e.g. after session restore on refresh)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
      });
      setBankData({
        bankName: user.bankAccount?.bankName || '',
        accountHolderName: user.bankAccount?.accountHolderName || '',
        accountNumber: user.bankAccount?.accountNumber || '',
        routingNumber: user.bankAccount?.routingNumber || '',
        instructions: user.bankAccount?.instructions || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await dispatch(updateProfile(formData)).unwrap();
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // ── Bank account handlers ─────────────────────────────────────────────────
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankError('');
    setBankSuccess('');
    setBankLoading(true);
    try {
      await dispatch(updateProfile({ bankAccount: bankData })).unwrap();
      setBankSuccess('Bank account saved successfully.');
      setIsBankEditing(false);
    } catch (err) {
      setBankError(err?.message || 'Failed to save bank account.');
    } finally {
      setBankLoading(false);
    }
  };

  const handleBankCancel = () => {
    setBankData({
      bankName: user?.bankAccount?.bankName || '',
      accountHolderName: user?.bankAccount?.accountHolderName || '',
      accountNumber: user?.bankAccount?.accountNumber || '',
      routingNumber: user?.bankAccount?.routingNumber || '',
      instructions: user?.bankAccount?.instructions || '',
    });
    setIsBankEditing(false);
    setBankError('');
    setBankSuccess('');
  };

  // ── Change password handler ───────────────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      setPasswordSuccess('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Profile image handlers ────────────────────────────────────────────────
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setImageSuccess('');

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setImageError('Only JPEG and PNG images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    setImageUploading(true);
    try {
      await dispatch(uploadProfileImage(formData)).unwrap();
      setImageSuccess('Profile photo updated.');
    } catch (err) {
      setImageError(err?.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
      // Reset file input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  // Derive initials for the default avatar placeholder
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const avatarSrc = user?.profileImage ? getImageUrl(user.profileImage) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <button
            onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* ── Profile image section ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            {/* Avatar circle */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ring-4 ring-white shadow-md">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-gray-500">{initials}</span>
              )}

              {/* Upload spinner overlay */}
              {imageUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
                </div>
              )}
            </div>

            {/* Camera icon overlay — visible on hover */}
            {!imageUploading && (
              <button
                type="button"
                onClick={handleImageClick}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-1.5 shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Image feedback messages */}
          {imageError && (
            <p className="mt-2 text-sm text-red-600">{imageError}</p>
          )}
          {imageSuccess && (
            <p className="mt-2 text-sm text-green-600">{imageSuccess}</p>
          )}

          <p className="mt-2 text-xs text-gray-400">
            Click the camera icon to change your photo (JPEG/PNG, max 5 MB)
          </p>
        </div>

        {/* ── Profile form feedback ── */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Account Type</p>
              <p className="mt-1 text-sm text-gray-900">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="mt-1 text-sm text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Bank Account section (sellers) ── */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Bank Account</h2>
              <p className="text-sm text-gray-500 mt-0.5">Buyers will see this info when making a payment for your property.</p>
            </div>
            <button
              type="button"
              onClick={() => isBankEditing ? handleBankCancel() : setIsBankEditing(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {isBankEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {bankError && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{bankError}</div>}
          {bankSuccess && !isBankEditing && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-md text-sm">{bankSuccess}</div>}

          {isBankEditing ? (
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    id="bankName"
                    value={bankData.bankName}
                    onChange={handleBankChange}
                    placeholder="e.g. Commercial Bank of Ethiopia"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    id="accountHolderName"
                    value={bankData.accountHolderName}
                    onChange={handleBankChange}
                    placeholder="Full name on account"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    id="accountNumber"
                    value={bankData.accountNumber}
                    onChange={handleBankChange}
                    placeholder="Your account number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">Routing / Branch Code <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    name="routingNumber"
                    id="routingNumber"
                    value={bankData.routingNumber}
                    onChange={handleBankChange}
                    placeholder="Branch or routing code"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Transfer Instructions <span className="text-gray-400">(optional)</span></label>
                <textarea
                  name="instructions"
                  id="instructions"
                  rows={2}
                  value={bankData.instructions}
                  onChange={handleBankChange}
                  placeholder="e.g. Use property title as reference"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={bankLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bankLoading ? 'Saving...' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              {user?.bankAccount?.bankName ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Bank Name</p>
                    <p className="mt-0.5 text-gray-900">{user.bankAccount.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Account Holder</p>
                    <p className="mt-0.5 text-gray-900">{user.bankAccount.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Account Number</p>
                    <p className="mt-0.5 text-gray-900 font-mono">{user.bankAccount.accountNumber}</p>
                  </div>
                  {user.bankAccount.routingNumber && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Routing / Branch Code</p>
                      <p className="mt-0.5 text-gray-900 font-mono">{user.bankAccount.routingNumber}</p>
                    </div>
                  )}
                  {user.bankAccount.instructions && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500">Instructions</p>
                      <p className="mt-0.5 text-gray-700">{user.bankAccount.instructions}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 sm:col-span-2">No bank account added yet. Click Edit to add your details.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Change Password section ── */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(v => !v);
                setPasswordError('');
                setPasswordSuccess('');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {passwordSuccess && !showPasswordSection && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {passwordSuccess}
            </div>
          )}

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
