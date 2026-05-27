import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Upload, Plus, X, ArrowRight, Loader2, LogOut, CheckCircle } from 'lucide-react';
import api from '../api';

export default function Onboarding({ updateUser }) {
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [batch, setBatch] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!year || !branch || !section || !batch) {
      setError('Please provide year, branch, section, and batch.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('year', year);
      formData.append('branch', branch);
      formData.append('section', section);
      formData.append('batch', batch);
      if (timetable) {
        formData.append('timetable', timetable);
      }

      const { data } = await api.post('/user/onboard', formData);

      updateUser(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Sign Out Button */}
      <button 
        onClick={handleSignOut}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-textDim hover:text-red-400 rounded-xl transition-all z-20 border border-white/10 hover:border-red-500/30"
      >
        <LogOut className="w-4 h-4" />
        <span className="font-medium text-sm">Sign Out</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-xl p-8 md:p-10 rounded-3xl z-10 mx-4 shadow-2xl shadow-primary/5"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-primaryHover rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Let's Personalize Your Experience</h1>
          <p className="text-textDim text-sm">Tell us a bit about your semester to build your customized dashboard.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year Input */}
          <div>
            <label className="block text-sm font-medium text-textDim mb-2">Current Academic Year</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-4 w-5 h-5 text-textDim" />
              <select 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="" disabled>Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>
          </div>

          {/* Branch Input */}
          <div>
            <label className="block text-sm font-medium text-textDim mb-2">Branch</label>
            <div className="relative flex items-center">
              <BookOpen className="absolute left-4 w-5 h-5 text-textDim" />
              <select 
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="" disabled>Select Branch</option>
                <option value="AIDS">AIDS</option>
                <option value="CE">CE</option>
              </select>
            </div>
          </div>

          {/* Section Input */}
          <div>
            <label className="block text-sm font-medium text-textDim mb-2">Section</label>
            <div className="relative flex items-center">
              <BookOpen className="absolute left-4 w-5 h-5 text-textDim" />
              <select 
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
                className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="" disabled>Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          {/* Batch Input */}
          <div>
            <label className="block text-sm font-medium text-textDim mb-2">Batch</label>
            <div className="relative flex items-center">
              <BookOpen className="absolute left-4 w-5 h-5 text-textDim" />
              <select 
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                required
                className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="" disabled>Select Batch</option>
                <option value="Batch 1">Batch 1</option>
                <option value="Batch 2">Batch 2</option>
              </select>
            </div>
          </div>

          {/* Timetable Input */}
          <div>
            <label className="block text-sm font-medium text-textDim mb-2">Upload Timetable (Optional)</label>
            <div className="relative flex items-center">
              <Upload className="absolute left-4 w-5 h-5 text-textDim" />
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => setTimetable(e.target.files[0])}
                className="w-full bg-surface border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
              />
            </div>
            {timetable && <p className="text-xs text-primary mt-2 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> {timetable.name}</p>}
          </div>          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 text-white font-medium py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-8 shadow-lg shadow-primary/25 hover:scale-[1.02]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Complete Setup'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
