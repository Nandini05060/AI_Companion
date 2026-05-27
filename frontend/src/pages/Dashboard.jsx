import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Settings, 
  Lock, 
  Sliders, 
  BookOpen, 
  FlaskConical, 
  Sparkles, 
  Trophy, 
  X,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Theme Color Definitions
const themeConfigs = {
  default: {
    primaryText: 'text-red-400',
    primaryBg: 'bg-red-500/10',
    primaryBorder: 'border-red-500/20',
    accentText: 'text-red-500',
    hoverBg: 'hover:bg-red-500/20',
    gradientText: 'from-red-400 to-orange-500',
    glowColor: 'rgba(239, 68, 68, 0.2)',
    badgeBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
    themeName: 'Sleek Crimson',
    colorHex: '#EF4444'
  },
  cyberpunk: {
    primaryText: 'text-cyan-400',
    primaryBg: 'bg-cyan-500/10',
    primaryBorder: 'border-cyan-500/20',
    accentText: 'text-cyan-500',
    hoverBg: 'hover:bg-cyan-500/20',
    gradientText: 'from-cyan-400 to-pink-500',
    glowColor: 'rgba(6, 182, 212, 0.2)',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    themeName: 'Cyberpunk Neon',
    colorHex: '#06B6D4'
  },
  amethyst: {
    primaryText: 'text-purple-400',
    primaryBg: 'bg-purple-500/10',
    primaryBorder: 'border-purple-500/20',
    accentText: 'text-purple-500',
    hoverBg: 'hover:bg-purple-500/20',
    gradientText: 'from-purple-400 to-indigo-500',
    glowColor: 'rgba(168, 85, 247, 0.2)',
    badgeBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    themeName: 'Royal Amethyst',
    colorHex: '#A855F7'
  },
  emerald: {
    primaryText: 'text-emerald-400',
    primaryBg: 'bg-emerald-500/10',
    primaryBorder: 'border-emerald-500/20',
    accentText: 'text-emerald-500',
    hoverBg: 'hover:bg-emerald-500/20',
    gradientText: 'from-emerald-400 to-amber-500',
    glowColor: 'rgba(16, 185, 129, 0.2)',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    themeName: 'Emerald Amber',
    colorHex: '#10B981'
  }
};

export default function Dashboard({ user, updateUser }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(user?.attendanceData || []);
  const [insights, setInsights] = useState([]);
  
  // Customization & Bifurcation States
  const [bifurcationTab, setBifurcationTab] = useState('All'); // All, Theory, Lab
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(user?.currentTheme || 'default');
  const [greetingNickname, setGreetingNickname] = useState(user?.customGreeting || '');
  const [hiddenCards, setHiddenCards] = useState(user?.hiddenCards || []);
  const [customizingLoading, setCustomizingLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [uploadingTimetable, setUploadingTimetable] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timetableInputRef = useRef(null);

  const handleTimetableUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingTimetable(true);
    
    try {
      const formData = new FormData();
      formData.append('timetable', file);
      
      const { data } = await api.put('/user/update-timetable', formData);
      updateUser(data);
      setAttendance(data.attendanceData);
      
      const insightsRes = await api.get('/user/attendance-insights');
      setInsights(insightsRes.data);
      
      alert("Timetable updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update timetable");
    } finally {
      setUploadingTimetable(false);
    }
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let [_, hours, mins, modifier] = match;
    hours = parseInt(hours, 10);
    mins = parseInt(mins, 10);
    if (hours === 12 && modifier.toUpperCase() === 'AM') hours = 0;
    if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
    return hours * 60 + mins;
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
    
    const checkUpcomingClasses = () => {
      const now = new Date();
      setCurrentTime(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayStr = days[now.getDay()];
      if (user?.schedule) {
        const todaysSchedule = user.schedule.find(s => s.day.toLowerCase() === todayStr.toLowerCase());
        if (todaysSchedule && todaysSchedule.slots) {
          todaysSchedule.slots.forEach(slot => {
            const startMins = parseTime(slot.startTime);
            if (startMins && startMins - currentMinutes === 10) {
               const key = `notified-${slot.subject}-${now.toDateString()}`;
               if (!sessionStorage.getItem(key)) {
                 sessionStorage.setItem(key, 'true');
                 if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Upcoming Class Alert", {
                      body: `${slot.subject} is starting in 10 minutes! ${slot.room ? 'Room: ' + slot.room : ''}`
                    });
                 }
               }
            }
          });
        }
      }
    };

    const timer = setInterval(checkUpcomingClasses, 60000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    // Check attendance lock status (after 6:00 PM local time)
    const currentHour = new Date().getHours();
    setIsLocked(currentHour >= 18);

    const fetchDashboardData = async () => {
      try {
        const { data: classData } = await api.get('/classes');
        setClasses(classData);
        
        // Sync attendance up to today
        const syncRes = await api.post('/user/sync-attendance');
        if (syncRes.data?.attendanceData) {
          setAttendance(syncRes.data.attendanceData);
          updateUser({ 
            attendanceData: syncRes.data.attendanceData, 
            lastAttendanceSync: syncRes.data.lastAttendanceSync 
          });
        }

        const insightsRes = await api.get('/user/attendance-insights');
        setInsights(insightsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleMarkAttendance = async (subject, status) => {
    // Backend locking check
    if (new Date().getHours() >= 18) {
      alert("Attendance is locked after 6:00 PM local time!");
      return;
    }

    try {
      const { data } = await api.put('/user/attendance', { subject, status });
      setAttendance(data);
      updateUser({ attendanceData: data });
      
      // Re-fetch insights
      const insightsRes = await api.get('/user/attendance-insights');
      setInsights(insightsRes.data);
    } catch (err) {
      console.error("Failed to mark attendance", err);
    }
  };

  const calculateOverallAttendance = () => {
    if (attendance.length === 0) return 100;
    let totalAttended = 0;
    let totalClasses = 0;
    attendance.forEach(item => {
      totalAttended += item.attended;
      totalClasses += item.total;
    });
    if (totalClasses === 0) return 100;
    return Math.round((totalAttended / totalClasses) * 100);
  };

  const handleSaveCustomization = async () => {
    setCustomizingLoading(true);
    try {
      const { data } = await api.put('/user/customize', {
        theme: selectedTheme,
        greetingNickname: greetingNickname,
        hiddenCards: hiddenCards
      });
      updateUser({
        currentTheme: data.currentTheme,
        customGreeting: data.customGreeting,
        hiddenCards: data.hiddenCards
      });
      setShowCustomizer(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update dashboard settings.");
    } finally {
      setCustomizingLoading(false);
    }
  };

  const toggleHiddenCard = (cardId) => {
    if (hiddenCards.includes(cardId)) {
      setHiddenCards(hiddenCards.filter(c => c !== cardId));
    } else {
      setHiddenCards([...hiddenCards, cardId]);
    }
  };

  const isCardVisible = (cardId) => {
    return !user?.hiddenCards?.includes(cardId);
  };

  if (loading) {
     return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  const overallAtt = calculateOverallAttendance();
  const theme = themeConfigs[user?.currentTheme || 'default'] || themeConfigs.default;
  const userPoints = user?.points || 0;

  // Custom greeting string
  const customGreetingStr = user?.customGreeting 
    ? user.customGreeting.replace('{name}', user?.name?.split(' ')[0])
    : `Welcome back, ${user?.name?.split(' ')[0]}!`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8 pb-12 relative max-w-7xl mx-auto"
    >
      {/* Sleek Professional Background Glow */}
      <div 
        className="absolute top-[-150px] left-1/4 w-[600px] h-[600px] rounded-full blur-[200px] pointer-events-none transition-all duration-1000 opacity-60"
        style={{ backgroundColor: theme.glowColor }}
      ></div>

      {/* Greeting and Customize trigger header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 bg-black/20 p-8 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
        <div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight text-white transition-all duration-500`}>
            {customGreetingStr}
          </h1>
          <p className="text-textDim mt-3 text-lg font-medium flex items-center gap-3">
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">Year {user?.year}</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">{user?.branch} - {user?.section}</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">{user?.batch || 'Batch 1'}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => {
              setSelectedTheme(user?.currentTheme || 'default');
              setGreetingNickname(user?.customGreeting || '');
              setHiddenCards(user?.hiddenCards || []);
              setShowCustomizer(true);
            }}
            className={`flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shadow-lg backdrop-blur-md`}
          >
            {userPoints >= 50 ? (
              <>
                <Settings className={`w-4 h-4 ${theme.primaryText}`} />
                <span className="font-semibold text-sm text-white tracking-wide">Customize Layout</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-sm text-textDim tracking-wide">Customizer (50 PTS)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 px-6 py-3 rounded-xl shadow-inner backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <span className="text-black font-black text-lg">★</span>
            </div>
            <div>
              <p className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-black">Total Score</p>
              <p className="text-2xl font-black text-yellow-400 tracking-tight leading-none">{userPoints}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Metrics Banner */}
      {isCardVisible('metrics') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-7 rounded-3xl flex flex-col justify-between border border-white/10 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <div className="z-10 flex flex-col h-full">
               <h3 className="text-textDim text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-white/50" /> Overall Attendance
               </h3>
               <div className="flex items-end gap-3 mt-2 flex-1">
                 <p className={`text-6xl font-black tracking-tighter leading-none ${overallAtt >= 80 ? 'text-green-400' : overallAtt >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {overallAtt}%
                 </p>
               </div>
               <p className="text-sm text-textDim mt-4 border-t border-white/5 pt-3">Combined average of all subjects</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-7 rounded-3xl flex flex-col justify-between border border-white/10 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <div className="z-10 flex flex-col h-full">
              <h3 className="text-textDim text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-white/50" /> Your Class Hub
              </h3>
              <p className="text-2xl font-black mt-2 text-white tracking-tight flex-1">
                {classes.length > 0 ? classes[0].name : (user ? `${user.branch} Year ${user.year} - ${user.section}` : "Not Assigned")}
              </p>
              <p className="text-sm text-textDim mt-4 border-t border-white/5 pt-3">Primary Classroom Group</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass p-7 rounded-3xl flex flex-col justify-between border border-white/10 relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <div className="z-10 flex flex-col h-full">
              <h3 className="text-textDim text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/50" /> Auto Sync
              </h3>
              <div className="mt-2 flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-2xl font-black text-white">Active</p>
              </div>
              <p className="text-sm text-textDim mt-4 border-t border-white/5 pt-3">Classes auto-marked Present daily</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column: Today's Schedule & Attendance Tracker */}
        {isCardVisible('analytics') && (
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
              <div 
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-colors duration-500"
                style={{ backgroundColor: theme.glowColor }}
              ></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <TrendingUp className={theme.primaryText} /> Today's Analytics & Roll Call
                </h2>
                
                {/* Theory/Lab Bifurcation Tabs */}
                <div className="flex bg-black/40 border border-white/10 p-1.5 rounded-xl">
                  {['All', 'Theory', 'Lab'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setBifurcationTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all
                        ${bifurcationTab === tab 
                          ? `bg-white/10 text-white border border-white/10` 
                          : 'text-textDim hover:text-white'
                        }
                      `}
                    >
                      {tab === 'All' ? 'All Classes' : tab === 'Theory' ? 'Theory' : 'Labs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Lock Status Bar */}
              {isLocked && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-2xl p-4 mb-6 flex items-center gap-3 relative z-10">
                  <Lock className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Attendance Window Closed: All roll call markings are locked after 6:00 PM in the evening.
                  </p>
                </div>
              )}
              
              {(!user?.schedule || user.schedule.length === 0) ? (
                <p className="text-textDim">No schedule found. Please upload your timetable during onboarding.</p>
              ) : (() => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const todayStr = days[new Date().getDay()];
                const todaysSchedule = user.schedule.find(s => s.day.toLowerCase() === todayStr.toLowerCase());
                
                if (!todaysSchedule || !todaysSchedule.slots || todaysSchedule.slots.length === 0) {
                  return (
                    <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 text-center">
                      <p className="text-textDim text-lg">No classes scheduled for today ({todayStr})! Enjoy your day.</p>
                    </div>
                  );
                }

                // Filter batch-specific classes
                const userBatch = user.batch || 'Batch 1';
                const filteredSlots = todaysSchedule.slots.filter(slot => {
                  const subject = slot.subject;
                  if (subject.includes('Batch 1') && userBatch !== 'Batch 1') return false;
                  if (subject.includes('Batch 2') && userBatch !== 'Batch 2') return false;
                  
                  // Filter by Theory / Lab bifurcation tab
                  if (bifurcationTab === 'Theory' && !slot.type?.toLowerCase().includes('theory') && !subject.toLowerCase().includes('theory')) return false;
                  if (bifurcationTab === 'Lab' && !slot.type?.toLowerCase().includes('lab') && !subject.toLowerCase().includes('lab') && !slot.type?.toLowerCase().includes('tut') && !subject.toLowerCase().includes('tut') && !subject.toLowerCase().includes('practical')) return false;
                  
                  return true;
                });

                if (filteredSlots.length === 0) {
                  return (
                    <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 text-center">
                      <p className="text-textDim text-md">
                        No {bifurcationTab.toLowerCase() === 'all' ? '' : bifurcationTab.toLowerCase()} classes scheduled for {userBatch} today.
                      </p>
                    </div>
                  );
                }
                
                const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                    {filteredSlots.map((slot, idx) => {
                      const subject = slot.subject;
                      const attItem = attendance.find(a => a.subject === subject) || { attended: 0, total: 0 };
                      const insightItem = insights.find(i => i.subject === subject);
                      const percent = attItem.total === 0 ? 100 : Math.round((attItem.attended / attItem.total) * 100);
                      
                      let colorClass = percent >= 80 ? 'text-green-400' : percent >= 60 ? 'text-yellow-400' : 'text-red-400';
                      let borderClass = percent >= 80 ? 'border-green-500/20' : percent >= 60 ? 'border-yellow-500/20' : 'border-red-500/20';

                      // Extract bifurcation tag
                      const isTheory = slot.type?.toLowerCase().includes('theory') || subject.toLowerCase().includes('theory');
                      const isLab = slot.type?.toLowerCase().includes('lab') || subject.toLowerCase().includes('lab') || subject.toLowerCase().includes('practical');
                      const isTut = slot.type?.toLowerCase().includes('tut') || subject.toLowerCase().includes('tut');
                      
                      const startMins = parseTime(slot.startTime);
                      const endMins = parseTime(slot.endTime);
                      let isOngoing = false;
                      if (startMins !== null && endMins !== null) {
                        isOngoing = currentMinutes >= startMins && currentMinutes <= endMins;
                      }

                      return (
                        <motion.div 
                          key={idx} 
                          whileHover={{ y: -5 }}
                          className={`bg-surface/80 backdrop-blur-md border ${isOngoing ? 'border-primary/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : borderClass} p-5 rounded-2xl flex flex-col justify-between shadow-lg relative`}
                        >
                          {isOngoing && (
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse border border-white/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> LIVE NOW
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                {isTheory && (
                                  <span className="text-[10px] uppercase font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                                    Theory
                                  </span>
                                )}
                                {isLab && !isTut && (
                                  <span className="text-[10px] uppercase font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                                    Practical Lab
                                  </span>
                                )}
                                {isTut && (
                                  <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                    Tutorial
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-lg text-white leading-tight mb-2 pr-2" title={subject}>
                                {subject}
                              </h3>
                              {slot.startTime && (
                                <p className="text-xs text-textDim font-medium mb-1">
                                  {slot.startTime} {slot.endTime ? `- ${slot.endTime}` : ''}
                                </p>
                              )}
                              {(slot.room || slot.faculty) && (
                                <p className="text-[11px] text-textDim flex flex-col gap-0.5">
                                  {slot.faculty && <span>👨‍🏫 {slot.faculty}</span>}
                                  {slot.room && <span>📍 {slot.room}</span>}
                                </p>
                              )}
                            </div>
                            
                            <div className={`flex flex-col items-end shrink-0 ml-2`}>
                              <span className={`text-2xl font-black ${colorClass}`}>
                                {attItem.total === 0 ? '100%' : `${percent}%`}
                              </span>
                              <span className="text-[10px] text-textDim">{attItem.attended}/{attItem.total} Attended</span>
                            </div>
                          </div>
                          
                          <div className="mb-5 space-y-2">
                            {insightItem && insightItem.safeBunks > 0 && (
                              <p className="text-xs text-green-400 flex items-center gap-1 bg-green-400/10 w-fit px-2 py-1 rounded-md">
                                <Info className="w-3 h-3" /> Safe to bunk {insightItem.safeBunks} classes
                              </p>
                            )}
                            {insightItem && insightItem.neededClasses > 0 && (
                              <p className="text-xs text-red-400 flex items-center gap-1 bg-red-400/10 w-fit px-2 py-1 rounded-md">
                                <AlertTriangle className="w-3 h-3" /> Attend next {insightItem.neededClasses} to reach 80%
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3 mt-auto">
                            <button 
                              disabled={true}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 py-2.5 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed"
                            >
                              <CheckCircle className="w-4 h-4" /> Auto Present
                            </button>
                            
                            <button 
                              onClick={() => handleMarkAttendance(subject, 'missed')}
                              disabled={isLocked}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${isLocked 
                                  ? 'bg-white/5 border border-white/15 text-textDim cursor-not-allowed'
                                  : 'bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                }
                              `}
                            >
                              <XCircle className="w-4 h-4" /> Mark Absent
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Right Column: Predictive Insights & Timetable */}
        <div className="space-y-8">
          
          {isCardVisible('insights') && (
            <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
              <h2 className="text-xl font-bold mb-5 text-white">Subject Insights</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {insights.map((insight, i) => (
                  <div key={i} className="bg-surface border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white text-sm leading-tight pr-2">{insight.subject}</h4>
                      <p className="text-xs text-textDim mt-1">
                        {insight.percentage >= 80 
                          ? `${insight.safeBunks} safe bunks left` 
                          : `Shortage! Attend ${insight.neededClasses} more`}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm shrink-0
                      ${insight.percentage >= 80 ? 'border-green-500/30 text-green-400' : insight.percentage >= 60 ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'}
                    `}>
                      {insight.percentage}%
                    </div>
                  </div>
                ))}
                {insights.length === 0 && <p className="text-textDim text-sm">No insights available.</p>}
              </div>
            </div>
          )}

          {isCardVisible('timetable') && (
            <div className="glass p-8 rounded-3xl border border-white/10 relative bg-black/20 shadow-2xl backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" /> Master Timetable
                </h2>
                <button 
                  onClick={() => timetableInputRef.current?.click()}
                  disabled={uploadingTimetable}
                  className="text-xs font-bold bg-white/5 hover:bg-white/15 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-white/10 text-white shadow-lg"
                >
                  {uploadingTimetable ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Modified'}
                </button>
                <input 
                  type="file" 
                  ref={timetableInputRef} 
                  onChange={handleTimetableUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              {user?.timetableUrl ? (
                <div className="relative rounded-2xl overflow-hidden group border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                  <img 
                    src={`http://localhost:5000${user.timetableUrl}`} 
                    alt="Weekly Timetable" 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer relative z-0"
                    onClick={() => window.open(`http://localhost:5000${user.timetableUrl}`, '_blank')}
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20 pointer-events-none">
                    <span className="text-white text-xs font-bold bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" /> Click to view in full resolution
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-dashed border-white/20 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <CalendarDays className="w-8 h-8 text-textDim" />
                  </div>
                  <h3 className="text-white font-bold mb-1">No Timetable Uploaded</h3>
                  <p className="text-xs text-textDim max-w-[200px]">Upload a picture of your routine and let AI parse it automatically.</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* DASHBOARD CUSTOMIZER MODAL */}
      <AnimatePresence>
        {showCustomizer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass border border-white/10 rounded-3xl w-full max-w-xl p-8 relative overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setShowCustomizer(false)}
                className="absolute top-4 right-4 text-textDim hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {userPoints >= 50 ? (
                // UNLOCKED PANEL
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Sliders className={`w-6 h-6 ${theme.primaryText}`} />
                    <h2 className="text-2xl font-black text-white">Customize Your Dashboard</h2>
                  </div>
                  <p className="text-textDim text-sm">
                    Pick a premium color theme, write a custom greeting, and choose which sections are visible to declutter your dashboard!
                  </p>

                  <hr className="border-white/10" />

                  {/* 1. Choose Theme */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Select Color Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(themeConfigs).map(([themeKey, config]) => (
                        <button
                          key={themeKey}
                          onClick={() => setSelectedTheme(themeKey)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left
                            ${selectedTheme === themeKey 
                              ? `bg-white/10 text-white` 
                              : 'bg-black/20 border-white/5 text-textDim hover:bg-black/40 hover:text-white'
                            }
                          `}
                          style={{ borderColor: selectedTheme === themeKey ? config.colorHex : 'transparent' }}
                        >
                          <span 
                            className="w-4 h-4 rounded-full inline-block shrink-0" 
                            style={{ backgroundColor: config.colorHex }}
                          ></span>
                          <span className="font-bold text-sm">{config.themeName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Custom Greeting */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Custom Greeting Nickname</label>
                    <p className="text-xs text-textDim mb-2">Use <code className="text-white font-bold">{'{name}'}</code> to insert your first name dynamically.</p>
                    <input 
                      type="text"
                      value={greetingNickname}
                      onChange={(e) => setGreetingNickname(e.target.value)}
                      placeholder="e.g. Master {name}, Academic Champ!"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 text-white"
                    />
                  </div>

                  {/* 3. Hide/Show cards */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">Show/Hide Sections</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'metrics', label: 'Metrics Banner' },
                        { id: 'analytics', label: 'Roll Call Analytics' },
                        { id: 'insights', label: 'Predictive Insights' },
                        { id: 'timetable', label: 'Weekly Timetable' }
                      ].map((card) => {
                        const isHidden = hiddenCards.includes(card.id);
                        return (
                          <button
                            key={card.id}
                            onClick={() => toggleHiddenCard(card.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all
                              ${!isHidden 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                              }
                            `}
                          >
                            <span>{card.label}</span>
                            <span className="text-xs font-black">
                              {!isHidden ? '✓ SHOWN' : '✕ HIDDEN'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCustomization}
                    disabled={customizingLoading}
                    className={`w-full bg-white text-black hover:bg-white/90 disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4`}
                  >
                    {customizingLoading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Apply Changes'}
                  </button>
                </div>
              ) : (
                // LOCKED PANEL GAMIFICATION
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                  <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                    <Lock className="w-10 h-10 text-yellow-500" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-black text-white">Dashboard Customizer Locked</h2>
                    <p className="text-textDim text-sm mt-2 max-w-sm">
                      Earn <span className="text-yellow-400 font-bold">50 points</span> to unlock this premium customization suite!
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-sm bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-textDim mb-2 uppercase">
                      <span>Progress</span>
                      <span className="text-yellow-400">{userPoints} / 50 PTS</span>
                    </div>
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-1000"
                        style={{ width: `${Math.min((userPoints / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <hr className="w-full border-white/10" />

                  {/* How to earn points */}
                  <div className="w-full text-left space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" /> How to Earn Points:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-textDim">Upload Notes/PYQ</span>
                        <span className="font-bold text-green-400">+10 PTS</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-textDim">Pomodoro Focus Room</span>
                        <span className="font-bold text-green-400">+10 PTS</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-textDim">Answer student doubt</span>
                        <span className="font-bold text-green-400">+5 PTS</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-textDim">Ask a student doubt</span>
                        <span className="font-bold text-green-400">+2 PTS</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCustomizer(false)}
                    className="w-full max-w-sm bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold border border-white/10"
                  >
                    Got It!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
