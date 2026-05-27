import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Loader2, 
  UploadCloud, 
  Search, 
  Star, 
  MessageSquare, 
  FileText, 
  ChevronDown, 
  Award, 
  Sparkles, 
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Classroom({ user, updateUser }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // All, Note, PYQ, Assignment, Lecture
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadType, setUploadType] = useState('Note');
  const [uploading, setUploading] = useState(false);

  // Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
         const { data: classData } = await api.get('/classes');
         setClasses(classData);
         if (classData.length > 0) {
            setActiveClass(classData[0]);
         }
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };
    fetchEnv();
  }, []);

  useEffect(() => {
     if (!activeClass) return;
     const fetchClassData = async () => {
        try {
           const resourcesRes = await api.get(`/resources/${activeClass._id}`);
           setResources(resourcesRes.data);
        } catch(err) {
           console.error(err);
        }
     };
     fetchClassData();
  }, [activeClass]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadSubject || !activeClass) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('subject', uploadSubject);
    formData.append('fileType', uploadType);

    try {
      const { data } = await api.post(`/resources/${activeClass._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Backend returns { resource, userPoints }
      setResources([data.resource, ...resources]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadSubject('');
      
      // Update global user points in real-time!
      if (data.userPoints !== undefined && updateUser) {
        updateUser({ points: data.userPoints });
      }
    } catch(err) {
      alert("Failed to upload resource");
    } finally {
      setUploading(false);
    }
  };

  const handleVoteResource = async (resId, type) => {
    try {
      const { data } = await api.post(`/resources/${resId}/vote`, { type });
      setResources(resources.map(r => r._id === resId ? data : r));
    } catch(err) {
      console.error(err);
    }
  };

  const handleSummarize = async (resId) => {
    try {
      const { data } = await api.post(`/resources/${resId}/summarize`);
      setResources(resources.map(r => r._id === resId ? { ...r, aiSummary: data.summary } : r));
    } catch(err) {
      alert("Failed to summarize");
    }
  };

  // Extract unique dates that contain notes
  const noteDates = useMemo(() => {
    const dates = new Set();
    resources.forEach(r => {
      if (r.fileType === 'Note') {
        const d = new Date(r.createdAt);
        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dates.add(formatted);
      }
    });
    return dates;
  }, [resources]);

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const daysArray = useMemo(() => {
    const temp = [];
    for (let i = 0; i < firstDayIndex; i++) {
      temp.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      temp.push(new Date(year, month, i));
    }
    return temp;
  }, [year, month, firstDayIndex, totalDays]);

  const changeMonth = (direction) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarDate(newDate);
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If a date is selected, we filter specifically by Notes uploaded on that date
      if (selectedDate) {
        if (r.fileType !== 'Note') return false;
        const d = new Date(r.createdAt);
        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return formatted === selectedDate && matchesSearch;
      }

      const matchesTab = activeTab === 'All' || r.fileType === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [resources, searchQuery, activeTab, selectedDate]);

  const leaderboard = useMemo(() => {
    const counts = {};
    resources.forEach(r => {
      if (!r.uploadedBy) return;
      const name = r.uploadedBy.name;
      counts[name] = (counts[name] || 0) + 1 + (r.upvotes?.length || 0); // 1 point for upload, 1 for upvote
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [resources]);

  if (loading) {
     return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  if (classes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] glass rounded-3xl m-10">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Classroom Found</h2>
          <p className="text-textDim text-center max-w-md">Please complete your onboarding from the profile/dashboard so we can auto-assign you to your branch's digital hub.</p>
        </div>
      );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-80px)] flex flex-col pb-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">
             {activeClass?.name} Hub
           </h1>
           <p className="text-textDim text-sm mt-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             {activeClass?.members?.length} students connected <span className="mx-2">•</span> <Sparkles className="w-4 h-4 text-yellow-400" /> {user?.points || 0} PTS
           </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textDim" />
             <input 
               type="text"
               placeholder="Search notes, PYQs..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-surface/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
             />
           </div>
           <button 
             onClick={() => setShowUploadModal(true)}
             className="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2"
           >
              <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Upload</span>
           </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Column 1: Categories & Calendar */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6 lg:col-span-1">
          {/* Categories Widget */}
          <div className="glass p-5 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-textDim uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-2">
              {['All', 'Note', 'PYQ', 'Assignment', 'Lecture'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedDate(null); // Clear date filter when shifting categories
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3
                    ${activeTab === tab && !selectedDate
                      ? 'bg-primary/20 text-white border border-primary/30' 
                      : 'text-textDim hover:bg-white/5'
                    }
                  `}
                >
                  <FileText className="w-4 h-4" /> {tab}s
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Notes calendar */}
          <div className="glass p-5 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-textDim uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Notes Calendar
              </h3>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-white flex items-center gap-1"
                >
                  Clear <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth('prev')} className="text-textDim hover:text-white"><ChevronLeft className="w-4 h-4"/></button>
                <span className="text-xs font-bold text-white">{months[month]} {year}</span>
                <button onClick={() => changeMonth('next')} className="text-textDim hover:text-white"><ChevronRight className="w-4 h-4"/></button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-textDim mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {daysArray.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-6"></div>;
                  
                  const dNum = day.getDate();
                  const formatted = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const hasNotes = noteDates.has(formatted);
                  const isDaySelected = selectedDate === formatted;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(formatted);
                        setActiveTab('Note'); // Automatically view notes category
                      }}
                      className={`h-6 text-xs font-semibold rounded-lg flex flex-col items-center justify-center relative transition-all
                        ${isDaySelected 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-textDim hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <span>{dNum}</span>
                      {hasNotes && (
                        <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isDaySelected ? 'bg-white' : 'bg-red-500'}`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Resources Feed */}
        <div className="lg:col-span-2 flex flex-col bg-surface/30 rounded-3xl border border-white/5 overflow-hidden h-full">
          {/* Header Bar */}
          <div className="p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center justify-between">
            <span className="text-xs font-bold text-textDim uppercase tracking-widest">
              {selectedDate ? `Notes Posted On ${selectedDate}` : `${activeTab}s Feed`}
            </span>
            {selectedDate && (
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                Date Filter Active
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <FileText className="w-12 h-12 text-textDim/50 mb-3" />
                <p className="text-textDim text-sm">No notes or resources found for this selection.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredResources.map(resource => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={resource._id} 
                    className="bg-surface/80 border border-white/10 p-5 rounded-2xl hover:border-primary/30 transition-all shadow-md group relative overflow-hidden"
                  >
                    {resource.isPinned && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-black" /> Pinned
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {resource.fileType}
                          </span>
                          <span className="text-xs text-textDim bg-white/5 px-2 py-0.5 rounded">
                            {resource.subject}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => window.open(`http://localhost:5000${resource.fileUrl}`, '_blank')}>
                          {resource.title}
                        </h3>
                        <p className="text-xs text-textDim mt-1 flex items-center gap-1">
                          By <span className="font-medium text-gray-300">{resource.uploadedBy?.name}</span> • {new Date(resource.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => window.open(`http://localhost:5000${resource.fileUrl}`, '_blank')}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-textDim hover:bg-primary hover:text-white transition-all shadow-lg shrink-0"
                      >
                        <ChevronDown className="w-5 h-5 -rotate-90" />
                      </button>
                    </div>

                    {resource.aiSummary ? (
                      <div className="mt-4 bg-primary/5 border border-primary/10 p-3 rounded-xl">
                        <p className="text-xs text-gray-300 leading-relaxed flex gap-2">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" /> {resource.aiSummary}
                        </p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleSummarize(resource._id)}
                        className="mt-4 text-xs font-medium text-primary flex items-center gap-1 hover:text-red-400 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Ask AI to Summarize
                      </button>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                      <button onClick={() => handleVoteResource(resource._id, 'up')} className="flex items-center gap-1.5 text-xs font-medium text-textDim hover:text-green-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
                        ▲ <span className={resource.upvotes?.includes(user?._id) ? 'text-green-400' : ''}>{resource.upvotes?.length || 0}</span>
                      </button>
                      <button onClick={() => handleVoteResource(resource._id, 'down')} className="flex items-center gap-1.5 text-xs font-medium text-textDim hover:text-red-400 transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
                        ▼ <span className={resource.downvotes?.includes(user?._id) ? 'text-red-400' : ''}>{resource.downvotes?.length || 0}</span>
                      </button>
                      <div className="ml-auto flex gap-1">
                        {resource.tags?.slice(0,2).map(t => (
                          <span key={t} className="text-[10px] text-textDim bg-surface px-2 py-1 rounded">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Column 4: Leaderboard & Doubt Portal CTA */}
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6 lg:col-span-1">
          {/* Doubt Portal Redirection Widget */}
          <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden bg-gradient-to-tr from-blue-900/20 to-transparent">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Class Doubt Portal</h3>
            <p className="text-xs text-textDim leading-relaxed mb-4">
              Got stuck on an assignment, lecture, or practical lab? Post your doubts in our dedicated Doubt Portal thread, discuss with peers, and earn points for active participation!
            </p>
            <button
              onClick={() => navigate('/doubts')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
            >
              Open Doubt Portal →
            </button>
          </div>

          {/* Leaderboard Widget */}
          <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-bold text-textDim uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" /> Top Contributors
            </h3>
            <div className="space-y-4 relative z-10">
              {leaderboard.map(([name, score], idx) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                        idx === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' :
                        idx === 2 ? 'bg-orange-600/20 text-orange-500 border border-orange-600/30' :
                        'bg-surface text-textDim'
                      }
                    `}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-white">{name.split(' ')[0]}</span>
                  </div>
                  <span className="text-xs text-primary font-bold">{score} pts</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-xs text-textDim">No contributions yet.</p>}
            </div>
          </div>
        </div>

      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-surface border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-textDim hover:text-white">✕</button>
              <h2 className="text-2xl font-bold mb-6 text-white">Upload Resource</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-textDim mb-1 uppercase tracking-wider">Title</label>
                  <input required value={uploadTitle} onChange={e=>setUploadTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" placeholder="e.g. Chapter 1 Notes" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-textDim mb-1 uppercase tracking-wider">Subject</label>
                    <input required value={uploadSubject} onChange={e=>setUploadSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" placeholder="e.g. CS-301" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textDim mb-1 uppercase tracking-wider">Type</label>
                    <select value={uploadType} onChange={e=>setUploadType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white">
                      <option value="Note">Note</option>
                      <option value="PYQ">PYQ</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Lecture">Lecture</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-textDim mb-1 uppercase tracking-wider">File (PDF/Image)</label>
                  <div className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer relative">
                    <input type="file" required onChange={e=>setUploadFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <UploadCloud className="w-8 h-8 text-primary mb-2" />
                    <p className="text-sm font-medium text-white">{uploadFile ? uploadFile.name : 'Click or drag file here'}</p>
                  </div>
                </div>

                <button disabled={uploading} type="submit" className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex justify-center mt-2">
                  {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Upload & Share'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
