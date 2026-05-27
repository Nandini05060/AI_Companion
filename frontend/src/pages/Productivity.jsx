import { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Plus, Trash2, CheckCircle, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Productivity({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Pomodoro Timer Logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (!isBreak) {
        // Study session finished! Reward points!
        rewardPomodoroPoints();
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        // Break finished
        setIsBreak(false);
        setTimeLeft(25 * 60); // back to 25 mins
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rewardPomodoroPoints = async () => {
    try {
      await api.post('/user/pomodoro-reward');
      // Could show a toast notification here
    } catch(err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const { data } = await api.post('/tasks', { title: newTaskTitle, dueDate: newTaskDue || undefined });
      setTasks([data, ...tasks]);
      setShowModal(false);
      setNewTaskTitle('');
      setNewTaskDue('');
    } catch (err) {
      console.error('Failed to add task', err);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, { completed: !currentStatus });
      setTasks(tasks.map(t => t._id === id ? data : t));
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayStr = days[new Date().getDay()];
  const todaysSchedule = user?.schedule?.find(s => s.day.toLowerCase() === todayStr.toLowerCase());

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <h1 className="text-3xl font-bold">Productivity Hub</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Timetable & Pomodoro */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Pomodoro Timer */}
          <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-between">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><Timer className="text-primary"/> Focus Room</h2>
              <p className="text-textDim text-sm mt-1">{isBreak ? 'Take a breather!' : 'Stay focused for 25 mins to earn 10 points.'}</p>
              
              <div className="mt-4 flex items-center gap-4">
                <button 
                  onClick={toggleTimer}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${isActive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-primary hover:bg-primaryHover shadow-primary/30'}`}
                >
                  {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <button 
                  onClick={resetTimer}
                  className="w-10 h-10 rounded-full bg-surface border border-white/10 hover:bg-white/5 flex items-center justify-center text-textDim hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-center bg-black/30 p-6 rounded-3xl border border-white/5 shadow-inner">
              <span className={`text-5xl font-mono font-bold tracking-tight ${isBreak ? 'text-green-400' : 'text-primary'}`}>
                {formatTime(timeLeft)}
              </span>
              <p className="text-xs font-medium text-textDim uppercase tracking-widest mt-2">{isBreak ? 'Break Time' : 'Study Time'}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden flex-1">
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold">Today's Classes</h2>
              <span className="text-sm font-medium bg-surface/80 px-4 py-1.5 rounded-full text-textDim">{todayStr}, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              {!todaysSchedule || !todaysSchedule.subjects || todaysSchedule.subjects.length === 0 ? (
                <div className="bg-surface/50 border border-white/5 p-8 rounded-2xl text-center">
                  <p className="text-textDim">No classes scheduled for today! Enjoy your free time.</p>
                </div>
              ) : (
                todaysSchedule.subjects.map((subject, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      key={i} 
                      className="flex gap-4 items-center bg-surface/60 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg"
                    >
                      <div className="w-24 text-center flex-shrink-0">
                          <p className="font-bold text-primary">{timeSlots[i] || "TBA"}</p>
                      </div>
                      <div className="w-1 h-10 bg-primary/20 rounded-full hidden sm:block"></div>
                      <div className="flex-1">
                          <p className="font-semibold text-lg">{subject}</p>
                          <p className="text-sm text-textDim">Scheduled Class</p>
                      </div>
                    </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Tasks */}
        <div className="flex flex-col gap-6">
           <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col h-[650px]">
             <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-4 relative z-10">
               <h2 className="text-xl font-bold">Tasks & Goals</h2>
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6 text-primary"/></div>
                ) : tasks.length === 0 ? (
                  <p className="text-textDim text-sm text-center mt-10">No pending tasks. You're all caught up!</p>
                ) : (
                  tasks.map(task => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task._id} 
                      className={`flex gap-3 items-start p-3 rounded-xl transition-all border ${task.completed ? 'bg-green-500/5 border-green-500/10 opacity-70' : 'bg-surface border-white/5'}`}
                    >
                       <button 
                         onClick={() => toggleTask(task._id, task.completed)}
                         className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-textDim hover:border-primary'}`}
                       >
                         {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                       </button>
                       <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-textDim' : 'text-white'}`}>{task.title}</p>
                          {task.dueDate && <p className="text-xs text-textDim mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                       </div>
                       <button 
                         onClick={() => deleteTask(task._id)}
                         className="text-textDim hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </motion.div>
                  ))
                )}
             </div>

             <button 
               onClick={() => setShowModal(true)}
               className="w-full mt-4 text-sm font-medium bg-primary hover:bg-primaryHover text-white py-3 rounded-xl transition-all shadow-lg shadow-primary/20 relative z-10 flex justify-center items-center gap-2"
             >
               <Plus className="w-4 h-4" /> Add Task
             </button>
           </div>
        </div>

      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-md w-full rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Add New Task</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm text-textDim mb-1">Task Title</label>
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="e.g. Complete OS Assignment"
                  />
                </div>
                <div>
                  <label className="block text-sm text-textDim mb-1">Due Date (Optional)</label>
                  <input 
                    type="date" 
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl bg-surface hover:bg-surface/80 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primaryHover text-white transition-colors font-medium shadow-lg shadow-primary/20"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
