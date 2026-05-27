import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimetableEditor({ initialData, isEditing, onSave, onCancel, isSaving }) {
  const [days, setDays] = useState([]);

  useEffect(() => {
    if (initialData?.days) {
      setDays(initialData.days);
    } else if (initialData && Array.isArray(initialData)) {
      setDays(initialData); // If directly passed array
    } else {
      // Default empty structure
      setDays([
        { day: 'Monday', slots: [] },
        { day: 'Tuesday', slots: [] },
        { day: 'Wednesday', slots: [] },
        { day: 'Thursday', slots: [] },
        { day: 'Friday', slots: [] }
      ]);
    }
  }, [initialData]);

  const handleDayChange = (dayIndex, field, value) => {
    const updated = [...days];
    updated[dayIndex][field] = value;
    setDays(updated);
  };

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    const updated = [...days];
    updated[dayIndex].slots[slotIndex][field] = value;
    setDays(updated);
  };

  const addSlot = (dayIndex) => {
    const updated = [...days];
    updated[dayIndex].slots.push({
      time: '09:00 AM - 10:00 AM',
      subject: 'New Subject',
      faculty: '',
      room: '',
      type: 'lecture',
      notes: ''
    });
    setDays(updated);
  };

  const removeSlot = (dayIndex, slotIndex) => {
    const updated = [...days];
    updated[dayIndex].slots.splice(slotIndex, 1);
    setDays(updated);
  };

  const addDay = () => {
    setDays([...days, { day: 'New Day', slots: [] }]);
  };

  const removeDay = (dayIndex) => {
    const updated = [...days];
    updated.splice(dayIndex, 1);
    setDays(updated);
  };

  const handleSaveClick = () => {
    onSave({ days });
  };

  if (!days || days.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Review & Edit Schedule</h2>
        <div className="flex gap-3">
          {isEditing && onCancel && (
            <button 
              onClick={onCancel}
              className="px-4 py-2 flex items-center gap-2 rounded-xl text-white/70 hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          <button 
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-6 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl flex items-center gap-2 font-semibold transition shadow-[0_0_15px_rgba(139,0,0,0.3)] disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <><Save className="w-4 h-4" /> Save Timetable</>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {days.map((dayItem, dIndex) => (
            <motion.div 
              key={`day-${dIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="glass p-5 rounded-xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                {isEditing ? (
                  <input
                    type="text"
                    value={dayItem.day}
                    onChange={(e) => handleDayChange(dIndex, 'day', e.target.value)}
                    className="text-xl font-bold bg-transparent border-none outline-none text-white focus:bg-white/5 px-2 py-1 rounded"
                  />
                ) : (
                  <h3 className="text-xl font-bold text-white px-2 py-1">{dayItem.day}</h3>
                )}

                <div className="flex gap-2">
                  {isEditing && (
                    <button 
                      onClick={() => addSlot(dIndex)}
                      className="p-1.5 bg-white/5 hover:bg-primary/20 text-white rounded-lg transition"
                      title="Add Class"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                  {isEditing && (
                    <button 
                      onClick={() => removeDay(dIndex)}
                      className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                      title="Remove Day"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {dayItem.slots.length === 0 ? (
                <div className="text-center py-6 text-textDim italic">No classes scheduled for this day.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-textDim text-sm border-b border-white/5">
                        <th className="pb-3 px-2 font-medium"><Clock className="w-4 h-4 inline mr-2" />Time</th>
                        <th className="pb-3 px-2 font-medium"><BookOpen className="w-4 h-4 inline mr-2" />Subject</th>
                        <th className="pb-3 px-2 font-medium"><User className="w-4 h-4 inline mr-2" />Faculty</th>
                        <th className="pb-3 px-2 font-medium"><MapPin className="w-4 h-4 inline mr-2" />Room</th>
                        <th className="pb-3 px-2 font-medium">Type</th>
                        {isEditing && <th className="pb-3 px-2 font-medium w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {dayItem.slots.map((slot, sIndex) => (
                        <tr key={`slot-${sIndex}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 align-top">
                            {isEditing ? (
                              <input 
                                value={slot.time} 
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'time', e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1 w-32 text-sm focus:border-primary outline-none"
                              />
                            ) : (
                              <span className="text-sm">{slot.time}</span>
                            )}
                          </td>
                          <td className="py-3 px-2 align-top">
                            {isEditing ? (
                              <input 
                                value={slot.subject} 
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'subject', e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full text-sm font-semibold focus:border-primary outline-none"
                              />
                            ) : (
                              <span className="text-sm font-semibold">{slot.subject}</span>
                            )}
                          </td>
                          <td className="py-3 px-2 align-top">
                            {isEditing ? (
                              <input 
                                value={slot.faculty || ''} 
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'faculty', e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full text-sm focus:border-primary outline-none"
                                placeholder="TBD"
                              />
                            ) : (
                              <span className="text-sm text-textDim">{slot.faculty || '-'}</span>
                            )}
                          </td>
                          <td className="py-3 px-2 align-top">
                            {isEditing ? (
                              <input 
                                value={slot.room || ''} 
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'room', e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1 w-24 text-sm focus:border-primary outline-none"
                              />
                            ) : (
                              <span className="text-sm text-textDim">{slot.room || '-'}</span>
                            )}
                          </td>
                          <td className="py-3 px-2 align-top">
                            {isEditing ? (
                              <select 
                                value={slot.type || 'lecture'} 
                                onChange={(e) => handleSlotChange(dIndex, sIndex, 'type', e.target.value)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                              >
                                <option value="lecture">Lecture</option>
                                <option value="lab">Lab</option>
                                <option value="break">Break</option>
                                <option value="other">Other</option>
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold
                                ${slot.type === 'lab' ? 'bg-blue-500/20 text-blue-400' : 
                                  slot.type === 'break' ? 'bg-orange-500/20 text-orange-400' : 
                                  'bg-green-500/20 text-green-400'}
                              `}>
                                {slot.type || 'lecture'}
                              </span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="py-3 px-2 align-top">
                              <button 
                                onClick={() => removeSlot(dIndex, sIndex)}
                                className="p-1 text-textDim hover:text-red-400 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isEditing && (
          <button 
            onClick={addDay}
            className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary/50 text-textDim hover:text-white rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Day
          </button>
        )}
      </div>
    </div>
  );
}
