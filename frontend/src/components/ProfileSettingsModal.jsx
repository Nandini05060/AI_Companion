import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Save, Trash2, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import api from '../api';

export default function ProfileSettingsModal({ user, onClose, updateUser, onLogout }) {
  const [name, setName] = useState(user?.name || '');
  const [year, setYear] = useState(user?.year || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [section, setSection] = useState(user?.section || '');
  const [batch, setBatch] = useState(user?.batch || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewPic, setPreviewPic] = useState(user?.profilePicture ? `http://localhost:5000${user.profilePicture}` : null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('year', year);
      formData.append('branch', branch);
      formData.append('section', section);
      formData.append('batch', batch);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const { data } = await api.put('/user/update-profile', formData);
      updateUser(data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/user/delete-account');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass border border-white/10 rounded-3xl w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-textDim hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-black text-white mb-6">Profile Settings</h2>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-sm p-3 rounded-xl mb-4 text-center">{success}</div>}

        <div className="flex flex-col items-center mb-8">
          <div className="relative w-28 h-28 rounded-full bg-surface border-2 border-white/10 flex items-center justify-center overflow-hidden mb-4 shadow-lg">
            {previewPic ? (
              <img src={previewPic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-textDim" />
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Camera className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <p className="text-sm text-textDim">{user?.email}</p>
        </div>

        {!user?.isAdmin && (
          <form onSubmit={handleSaveProfile} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-textDim mb-1">Full Name</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDim mb-1">Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textDim mb-1">Branch</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="AIDS">AIDS</option>
                <option value="CE">CE</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textDim mb-1">Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-textDim mb-1">Batch</label>
              <select value={batch} onChange={(e) => setBatch(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="Batch 1">Batch 1</option>
                <option value="Batch 2">Batch 2</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5" />}
            Save Profile
          </button>
        </form>
        )}

        {!user?.isAdmin && <hr className="border-white/10 my-6" />}

        <div className="space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign Out from App
          </button>

          {!user?.isAdmin && (
            !confirmDelete ? (
            <button 
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-medium transition-all"
            >
              <Trash2 className="w-5 h-5" /> Delete Account
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
              <p className="text-sm text-red-400 mb-4">Are you absolutely sure? This will permanently delete your account, attendance, and tasks. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-surface border border-white/10 text-white py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="animate-spin w-4 h-4"/> : 'Yes, Delete'}
                </button>
              </div>
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
