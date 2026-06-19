import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { Camera, Loader2, Save } from 'lucide-react';

const SKILLS = ['Frontend', 'Backend', 'UI/UX Designer', 'DevOps', 'QA'];

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    avatarUrl: user?.avatarUrl || '',
    organizationName: user?.organizationName || '',
    organizationWebsite: user?.organizationWebsite || '',
    skills: user?.skills || []
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return <div className="p-8 text-slate-300">Loading profile...</div>;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      const updatedUser = await mockBackend.updateProfile({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
        organizationName: formData.organizationName,
        organizationWebsite: formData.organizationWebsite,
        skills: formData.skills
      });
      
      updateUser(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-8">Profile Settings</h1>
      
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <img 
                src={formData.avatarUrl} 
                alt="Profile Avatar" 
                className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera size={24} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-200">Profile Picture</h3>
              <p className="text-sm text-slate-400">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">New Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                placeholder="Leave blank to keep current"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Organization Website</label>
              <input
                type="url"
                value={formData.organizationWebsite}
                onChange={(e) => setFormData({...formData, organizationWebsite: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    formData.skills.includes(skill)
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Role Display */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-200">Current Role</p>
              <p className="text-xs text-indigo-400">{user.role}</p>
            </div>
            <div className="text-xs text-slate-500">
              Role changes must be requested from an admin.
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            {success && <span className="text-emerald-400 flex items-center text-sm">Profile updated successfully!</span>}
            <button
              type="submit"
              disabled={loading}
              className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-500/50 font-medium rounded-lg text-sm px-6 py-2.5 text-center transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
