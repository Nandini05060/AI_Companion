import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, Shield, Trash2, Search, CheckCircle, Activity, BookOpen, Clock, X, Trophy, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const { data } = await api.get('/admin/classrooms');
      setClassrooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError('Failed to load users. Make sure you have admin rights.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      setUsers(users.map(u => u._id === id ? { ...u, isApprovedByAdmin: true } : u));
    } catch (err) {
      alert('Failed to approve user.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this student?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleViewClassroom = (cls) => {
    navigate(`/admin/classroom/${cls._id}`);
  };

  const pendingUsers = users.filter(u => !u.isApprovedByAdmin);
  const activeUsers = users.filter(u => u.isApprovedByAdmin);

  const filteredActive = activeUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.sapId && u.sapId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-textDim">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Admin Control Center</h1>
            <p className="text-textDim mt-1">Manage platform access and regulate student classrooms</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-green-400 font-bold text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white">{activeUsers.length}</span>
          </div>
          <h3 className="font-semibold text-textDim relative z-10">Active Students</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl border border-yellow-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white">{pendingUsers.length}</span>
          </div>
          <h3 className="font-semibold text-textDim relative z-10">Pending Approvals</h3>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white">{users.length}</span>
          </div>
          <h3 className="font-semibold text-textDim relative z-10">Total Accounts</h3>
        </motion.div>
      </div>

      {/* Pending Approvals */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <UserCheck className="text-yellow-500" /> Pending Approvals ({pendingUsers.length})
        </h2>
        {pendingUsers.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center border border-white/5">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
            <p className="text-textDim text-lg">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map(u => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={u._id} 
                className="glass p-6 rounded-2xl border border-yellow-500/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
                <h3 className="font-bold text-xl text-white mb-1">{u.name}</h3>
                <p className="text-sm text-textDim mb-1">{u.email}</p>
                <div className="inline-block bg-white/10 px-3 py-1 rounded-md text-sm font-mono text-yellow-400 mb-6 border border-white/5">
                  SAP ID: {u.sapId || 'Not Provided'}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleApprove(u._id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleDelete(u._id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <UserX className="w-4 h-4" /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Active Students List */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" /> Active Students ({activeUsers.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textDim" />
            <input 
              type="text" 
              placeholder="Search by Name or SAP ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary/50 w-full md:w-80"
            />
          </div>
        </div>

        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 font-semibold text-textDim">Student Name</th>
                  <th className="p-4 font-semibold text-textDim">SAP ID</th>
                  <th className="p-4 font-semibold text-textDim">Email</th>
                  <th className="p-4 font-semibold text-textDim">Joined</th>
                  <th className="p-4 font-semibold text-textDim text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActive.map(u => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-lg">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </td>
                    <td className="p-4 font-mono text-blue-400 text-sm">{u.sapId || 'N/A'}</td>
                    <td className="p-4 text-textDim text-sm">{u.email}</td>
                    <td className="p-4 text-textDim text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(u._id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Remove Student"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredActive.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-textDim">No active students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Classrooms Section */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="text-purple-500" /> Managed Classrooms ({classrooms.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classrooms.map(cls => (
            <motion.div 
              key={cls._id}
              whileHover={{ y: -5 }}
              onClick={() => handleViewClassroom(cls)}
              className="glass p-6 rounded-2xl border border-white/10 cursor-pointer group hover:border-purple-500/50 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-colors"></div>
              <h3 className="font-bold text-xl text-white mb-2 relative z-10">{cls.name}</h3>
              <p className="text-textDim text-sm mb-4 relative z-10 line-clamp-2">{cls.description}</p>
              <div className="flex items-center gap-2 text-purple-400 font-medium text-sm relative z-10">
                <Users className="w-4 h-4" />
                {cls.members?.length || 0} Members
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
