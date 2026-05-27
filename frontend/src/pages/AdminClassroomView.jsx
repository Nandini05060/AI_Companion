import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Activity, MessageSquare, BookOpen, CheckCircle } from 'lucide-react';
import api from '../api';

export default function AdminClassroomView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassroomDetails();
  }, [id]);

  const fetchClassroomDetails = async () => {
    try {
      // We can fetch all classrooms and find this one, or create a specific endpoint
      // Let's just fetch all and find, since we already have the endpoint, 
      // or we can use the activities endpoint which also fetches the classroom? 
      // Wait, we need the classroom members.
      const classroomsRes = await api.get('/admin/classrooms');
      const cls = classroomsRes.data.find(c => c._id === id);
      
      if (!cls) {
        setError('Classroom not found');
        setLoading(false);
        return;
      }
      
      setClassroom(cls);

      const activitiesRes = await api.get(`/admin/classrooms/${id}/activities`);
      setActivities(activitiesRes.data);
    } catch (err) {
      setError('Failed to fetch classroom details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-2">{error}</h2>
        <button onClick={() => navigate('/admin')} className="text-blue-400 hover:underline">Return to Admin Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-textDim hover:text-white mb-6 transition-colors font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Control Center
      </button>

      <div className="glass p-8 rounded-3xl border border-purple-500/20 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
        <h1 className="text-4xl font-black text-white relative z-10">{classroom.name}</h1>
        <p className="text-purple-300 mt-2 text-lg relative z-10">{classroom.description}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-lg border border-purple-500/30 font-bold text-sm relative z-10">
          Code: {classroom.code}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-500 w-6 h-6" /> Student Leaderboard
            </h3>
            <span className="bg-white/10 text-textDim px-3 py-1 rounded-lg text-sm font-bold">
              {classroom.members?.length || 0} Members
            </span>
          </div>
          
          <div className="space-y-3">
            {[...(classroom.members || [])].sort((a, b) => (b.points || 0) - (a.points || 0)).map((member, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                key={member._id} 
                className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg
                    ${idx === 0 ? 'bg-gradient-to-tr from-yellow-600 to-yellow-400' : 
                      idx === 1 ? 'bg-gradient-to-tr from-gray-400 to-gray-300 text-gray-900' : 
                      idx === 2 ? 'bg-gradient-to-tr from-amber-700 to-amber-500' : 'bg-white/10'}
                  `}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{member.name}</p>
                    <p className="text-textDim text-xs font-mono">{member.sapId || 'System Admin'}</p>
                  </div>
                </div>
                <div className="bg-yellow-500/10 text-yellow-500 font-black px-4 py-2 rounded-xl text-lg border border-yellow-500/20">
                  {member.points || 0} pts
                </div>
              </motion.div>
            ))}
            {classroom.members?.length === 0 && (
              <div className="glass p-8 text-center rounded-2xl border border-white/5 text-textDim italic">
                No members found in this classroom.
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-blue-500 w-6 h-6" /> Classroom Feed
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {activities.map((act, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                  {act.type === 'Doubt' && <MessageSquare className="w-5 h-5 text-blue-400" />}
                  {act.type === 'Note' && <BookOpen className="w-5 h-5 text-green-400" />}
                  {act.type === 'Task' && <CheckCircle className="w-5 h-5 text-purple-400" />}
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5 w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-md ${act.type === 'Doubt' ? 'bg-blue-500/20 text-blue-400' : act.type === 'Note' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {act.type}
                    </span>
                    <span className="text-xs text-textDim font-medium">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-base text-white font-bold mb-2 line-clamp-2">{act.title}</p>
                  <p className="text-xs text-textDim italic">Posted by <span className="text-white font-medium">{act.userName}</span></p>
                </div>
              </motion.div>
            ))}
            {activities.length === 0 && (
              <div className="glass p-8 text-center rounded-2xl border border-white/5 text-textDim italic relative z-10 mx-12">
                No recent activities found for this classroom.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
