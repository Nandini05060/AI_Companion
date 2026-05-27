import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, MapPin, User as UserIcon, BookOpen } from 'lucide-react';

export default function TimetableView({ user }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' || today === 'Saturday' ? 'Monday' : today;
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const schedule = user?.schedule || [];
  const activeSchedule = schedule.find(s => s.day.toLowerCase() === selectedDay.toLowerCase());
  const slots = activeSchedule?.slots || [];

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-white">
            <CalendarDays className="text-primary w-8 h-8" />
            Weekly <span className="text-primary">Timetable</span>
          </h1>
          <p className="text-textDim mt-2 font-medium">
            Your smart extracted schedule. Unified weekly view.
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {daysOfWeek.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-6 py-3 rounded-2xl font-bold transition-all shrink-0 border
              ${selectedDay === day 
                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-surface/50 border-white/10 text-textDim hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {day}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {slots.length > 0 ? (
            slots.map((slot, idx) => {
              const isTheory = slot.type?.toLowerCase().includes('theory') || slot.subject.toLowerCase().includes('theory');
              const isLab = slot.type?.toLowerCase().includes('lab') || slot.subject.toLowerCase().includes('lab') || slot.subject.toLowerCase().includes('practical');
              const isTut = slot.type?.toLowerCase().includes('tut') || slot.subject.toLowerCase().includes('tut');

              return (
                <div 
                  key={idx} 
                  className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-white/30 transition-all shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-1.5">
                          {isTheory && (
                            <span className="text-[10px] uppercase font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                              Theory
                            </span>
                          )}
                          {isLab && !isTut && (
                            <span className="text-[10px] uppercase font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                              Lab
                            </span>
                          )}
                          {isTut && (
                            <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Tutorial
                            </span>
                          )}
                       </div>
                       {slot.startTime && (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                           <Clock className="w-3 h-3 text-primary" />
                           {slot.startTime} {slot.endTime ? `- ${slot.endTime}` : ''}
                         </div>
                       )}
                    </div>
                    
                    <h3 className="font-bold text-xl text-white mb-4 leading-tight">
                      {slot.subject}
                    </h3>
                    
                    <div className="space-y-2 mt-auto pt-4 border-t border-white/10">
                      {slot.faculty && (
                        <p className="flex items-center gap-2 text-sm text-textDim font-medium">
                          <UserIcon className="w-4 h-4 text-white/50" /> {slot.faculty}
                        </p>
                      )}
                      {slot.room && (
                        <p className="flex items-center gap-2 text-sm text-textDim font-medium">
                          <MapPin className="w-4 h-4 text-white/50" /> {slot.room}
                        </p>
                      )}
                      {!slot.faculty && !slot.room && (
                        <p className="flex items-center gap-2 text-sm text-white/30 italic">
                          <BookOpen className="w-4 h-4" /> Regular Session
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-surface/30 border border-white/5 rounded-3xl">
              <CalendarDays className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Classes Scheduled</h3>
              <p className="text-textDim">Enjoy your free day or use this time for self-study!</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
