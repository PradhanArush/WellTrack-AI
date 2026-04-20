import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { User, Mail, Calendar, Ruler, Scale, Edit2, Save, X, Trash2, Lock } from 'lucide-react';

// Profile page — view/edit personal info, set nutrition goals, and delete account
// setUser propagates changes back to App.jsx so the Navbar reflects the updated name
const ProfilePage = ({ user, setUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false); // Toggles all form fields between read-only and editable
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState(''); // Password required to confirm account deletion
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    date_of_birth: '',
    height: '',
    weight: '',
    gender: '',
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 250,
    fiber_goal: 30,
    fats_goal: 65,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const data = response.data;
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        username: data.username || '',
        date_of_birth: data.date_of_birth || '',
        height: data.height || '',
        weight: data.weight || '',
        gender: data.gender || '',
        calorie_goal: data.calorie_goal || 2000,
        protein_goal: data.protein_goal || 150,
        carbs_goal: data.carbs_goal || 250,
        fiber_goal: data.fiber_goal || 30,
        fats_goal: data.fats_goal || 65,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert empty strings to null for optional numeric/date fields before sending to backend
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        height: formData.height !== '' ? formData.height : null,
        weight: formData.weight !== '' ? formData.weight : null,
        gender: formData.gender || '',
      };
      const response = await authAPI.updateProfile(payload);
      // Update both App.jsx state and localStorage so the navbar shows the new name immediately
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Account deletion requires password confirmation — on success, calls onLogout to clear state and redirect
  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password.'); return; }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await authAPI.deleteAccount(deletePassword);
      onLogout();
    } catch (error) {
      setDeleteError(error.response?.data?.error || 'Incorrect password. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-12 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{formData.full_name || 'Your Profile'}</h1>
                <p className="text-teal-100">@{formData.username}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
              >
                <Edit2 className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Personal Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="170"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="70"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition Goals */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Nutrition Goals</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                <input
                  type="number"
                  value={formData.calorie_goal}
                  onChange={(e) => setFormData({ ...formData, calorie_goal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                <input
                  type="number"
                  value={formData.protein_goal}
                  onChange={(e) => setFormData({ ...formData, protein_goal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                <input
                  type="number"
                  value={formData.carbs_goal}
                  onChange={(e) => setFormData({ ...formData, carbs_goal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
                <input
                  type="number"
                  value={formData.fiber_goal}
                  onChange={(e) => setFormData({ ...formData, fiber_goal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fats (g)</label>
                <input
                  type="number"
                  value={formData.fats_goal}
                  onChange={(e) => setFormData({ ...formData, fats_goal: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </form>

        {/* Danger Zone */}
        <div className="px-8 pb-8">
          <div className="border border-red-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
            <button
              onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }}
              className="flex items-center space-x-2 px-4 py-2 border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center animate-slideUp">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Delete Account?</h2>
            <p className="text-gray-500 text-sm text-center mb-5">
              This will permanently delete your account and all your data. Enter your password to confirm.
            </p>
            <div className="w-full mb-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                />
              </div>
              {deleteError && <p className="text-red-500 text-xs mt-2">{deleteError}</p>}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition font-medium disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;