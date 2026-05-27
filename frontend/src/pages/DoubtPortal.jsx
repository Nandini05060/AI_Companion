import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { 
  Loader2, 
  MessageSquare, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Send, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  HelpCircle, 
  MessageCircle, 
  User, 
  Clock, 
  Sparkles,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoubtPortal({ user, updateUser }) {
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  
  // Posting states
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  // Editing states
  const [editingDoubtId, setEditingDoubtId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
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
    fetchClasses();
  }, []);

  // Fetch doubts when active class changes
  useEffect(() => {
    if (!activeClass) return;
    const fetchDoubts = async () => {
      try {
        const { data } = await api.get(`/doubts/${activeClass._id}`);
        setDoubts(data);
        // Automatically select the first doubt if available
        if (data.length > 0) {
          setSelectedDoubt(data[0]);
        } else {
          setSelectedDoubt(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoubts();
  }, [activeClass]);

  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !activeClass) return;
    setAsking(true);
    try {
      const { data } = await api.post(`/doubts/${activeClass._id}`, { question: newQuestion });
      // Backend returns { doubt, userPoints }
      setDoubts([data.doubt, ...doubts]);
      setSelectedDoubt(data.doubt);
      setNewQuestion('');
      setShowAskModal(false);
      
      // Sync user points in real-time (+2 PTS for asking a doubt)
      if (data.userPoints !== undefined && updateUser) {
        updateUser({ points: data.userPoints });
      }
    } catch (err) {
      alert("Failed to post doubt");
    } finally {
      setAsking(false);
    }
  };

  const handleReplyDoubt = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedDoubt) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/doubts/${selectedDoubt._id}/reply`, { content: replyContent });
      // Backend returns { doubt, userPoints }
      setDoubts(doubts.map(d => d._id === selectedDoubt._id ? data.doubt : d));
      setSelectedDoubt(data.doubt);
      setReplyContent('');

      // Sync user points in real-time (+5 PTS for replying)
      if (data.userPoints !== undefined && updateUser) {
        updateUser({ points: data.userPoints });
      }
    } catch (err) {
      alert("Failed to submit reply");
    } finally {
      setReplying(false);
    }
  };

  const handleVoteDoubt = async (doubtId, type) => {
    try {
      const { data } = await api.post(`/doubts/${doubtId}/vote`, { type });
      setDoubts(doubts.map(d => d._id === doubtId ? data : d));
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit doubt logic
  const startEditDoubt = (doubt) => {
    setEditingDoubtId(doubt._id);
    setEditedQuestion(doubt.question);
  };

  const cancelEditDoubt = () => {
    setEditingDoubtId(null);
    setEditedQuestion('');
  };

  const handleSaveEditDoubt = async (doubtId) => {
    if (!editedQuestion.trim()) return;
    setSavingEdit(true);
    try {
      const { data } = await api.put(`/doubts/${doubtId}`, { question: editedQuestion });
      // Backend returns populated doubt
      setDoubts(doubts.map(d => d._id === doubtId ? data : d));
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt(data);
      }
      setEditingDoubtId(null);
    } catch (err) {
      alert("Failed to update doubt");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete doubt logic
  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm("Are you sure you want to delete this doubt? This action cannot be undone.")) return;
    try {
      await api.delete(`/doubts/${doubtId}`);
      const updatedDoubts = doubts.filter(d => d._id !== doubtId);
      setDoubts(updatedDoubts);
      
      // Reselect active doubt
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt(updatedDoubts.length > 0 ? updatedDoubts[0] : null);
      }
    } catch (err) {
      alert("Failed to delete doubt");
    }
  };

  const filteredDoubts = useMemo(() => {
    return doubts.filter(d => 
      d.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [doubts, searchQuery]);

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-80px)] flex flex-col pb-6 overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Doubt Discussion Portal
          </h1>
          <p className="text-textDim text-sm mt-1">
            Ask questions, help classmates, vote on key topics, and earn points for answers.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick Stats Panel */}
          <div className="flex items-center gap-3 bg-blue-900/10 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold text-blue-400">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Class Score: {user?.points || 0} PTS</span>
          </div>

          <button 
            onClick={() => setShowAskModal(true)}
            className="flex-1 sm:flex-initial bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Ask Doubt
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Left Column: Doubts Feed List */}
        <div className="lg:col-span-1 flex flex-col bg-surface/30 rounded-3xl border border-white/5 overflow-hidden h-full">
          <div className="p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textDim" />
              <input 
                type="text"
                placeholder="Search doubts or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white placeholder-textDim"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-textDim">
              <span className="font-bold uppercase tracking-wider">Doubts ({filteredDoubts.length})</span>
              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px]">Active Hub</span>
            </div>
          </div>

          {/* List Scroll Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredDoubts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <HelpCircle className="w-12 h-12 text-textDim/40 mb-2" />
                <p className="text-textDim text-sm">No doubts match your search.</p>
              </div>
            ) : (
              filteredDoubts.map((doubt) => {
                const totalVotes = (doubt.upvotes?.length || 0) - (doubt.downvotes?.length || 0);
                const isSelected = selectedDoubt?._id === doubt._id;

                return (
                  <motion.div
                    key={doubt._id}
                    onClick={() => {
                      setSelectedDoubt(doubt);
                      // Clear editing state when swapping doubts
                      setEditingDoubtId(null);
                    }}
                    whileHover={{ x: 2 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex gap-3
                      ${isSelected 
                        ? 'bg-blue-950/20 border-blue-500/30 shadow-md shadow-blue-500/5' 
                        : 'bg-surface/80 border-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    {/* Vote Score Indicator */}
                    <div className="flex flex-col items-center justify-center bg-black/30 px-2 py-1 rounded-xl h-fit min-w-[32px] shrink-0 text-xs">
                      <ArrowUp className={`w-3.5 h-3.5 ${doubt.upvotes?.includes(user?._id) ? 'text-blue-400' : 'text-textDim'}`} />
                      <span className="font-bold text-white my-0.5">{totalVotes}</span>
                      <ArrowDown className={`w-3.5 h-3.5 ${doubt.downvotes?.includes(user?._id) ? 'text-red-400' : 'text-textDim'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white line-clamp-2 leading-relaxed">
                        {doubt.question}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 text-[10px] text-textDim">
                        <span className="truncate max-w-[80px] font-medium text-gray-300">
                          {doubt.author?.name?.split(' ')[0]}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-blue-400" /> {doubt.replies?.length || 0}
                          </span>
                          <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Doubt Details, Edit/Delete Operations, and Reply Thread */}
        <div className="lg:col-span-2 flex flex-col bg-surface/30 rounded-3xl border border-white/5 overflow-hidden h-full">
          {selectedDoubt ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header: Doubt Content & Author details */}
              <div className="p-6 border-b border-white/5 bg-surface/50 backdrop-blur-md relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                
                {/* Author Info */}
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{selectedDoubt.author?.name}</h4>
                      <p className="text-[10px] text-textDim flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Posted on {new Date(selectedDoubt.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Author (Edit / Delete Doubt) */}
                  {(selectedDoubt.author?._id === user?._id || selectedDoubt.author === user?._id) && (
                    <div className="flex items-center gap-2">
                      {editingDoubtId === selectedDoubt._id ? (
                        <>
                          <button 
                            onClick={() => handleSaveEditDoubt(selectedDoubt._id)}
                            disabled={savingEdit}
                            className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white p-1.5 rounded-lg border border-green-500/30 text-xs flex items-center gap-1 transition-all"
                          >
                            {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Save</span>
                          </button>
                          <button 
                            onClick={cancelEditDoubt}
                            className="bg-white/5 hover:bg-white/10 text-white p-1.5 rounded-lg border border-white/10 text-xs flex items-center gap-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEditDoubt(selectedDoubt)}
                            className="bg-white/5 hover:bg-white/10 text-blue-400 p-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all"
                            title="Edit Doubt"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteDoubt(selectedDoubt._id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-1.5 rounded-lg border border-red-500/20 hover:border-red-500 transition-all"
                            title="Delete Doubt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Body */}
                <div className="relative z-10 bg-black/20 border border-white/5 p-4 rounded-2xl">
                  {editingDoubtId === selectedDoubt._id ? (
                    <textarea
                      value={editedQuestion}
                      onChange={(e) => setEditedQuestion(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 text-white min-h-[80px]"
                      placeholder="Modify your doubt..."
                    />
                  ) : (
                    <p className="text-white text-base font-semibold leading-relaxed whitespace-pre-wrap">
                      {selectedDoubt.question}
                    </p>
                  )}
                </div>

                {/* Vote panel for detailed thread */}
                <div className="flex gap-4 mt-4 relative z-10">
                  <button 
                    onClick={() => handleVoteDoubt(selectedDoubt._id, 'up')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all
                      ${selectedDoubt.upvotes?.includes(user?._id)
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/5 text-textDim hover:text-blue-400'
                      }
                    `}
                  >
                    <ArrowUp className="w-3.5 h-3.5" /> Upvote ({selectedDoubt.upvotes?.length || 0})
                  </button>
                  
                  <button 
                    onClick={() => handleVoteDoubt(selectedDoubt._id, 'down')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all
                      ${selectedDoubt.downvotes?.includes(user?._id)
                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                        : 'bg-white/5 border-white/5 text-textDim hover:text-red-400'
                      }
                    `}
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> Downvote ({selectedDoubt.downvotes?.length || 0})
                  </button>
                </div>
              </div>

              {/* Replies Feed Thread */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-textDim mb-2 inline-block">
                  Replies Thread ({selectedDoubt.replies?.length || 0})
                </span>

                {selectedDoubt.replies?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare className="w-10 h-10 text-textDim/30 mb-2" />
                    <p className="text-textDim text-sm">No replies yet. Be the first to answer and earn 5 PTS!</p>
                  </div>
                ) : (
                  selectedDoubt.replies.map((reply, i) => (
                    <div 
                      key={i} 
                      className={`p-4 rounded-2xl border flex gap-3 relative
                        ${reply.author?._id === selectedDoubt.author?._id || reply.author === selectedDoubt.author
                          ? 'bg-blue-900/5 border-blue-500/10' 
                          : 'bg-surface border-white/5'
                        }
                      `}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white uppercase">
                        {reply.author?.name?.slice(0, 1)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {reply.author?.name}
                            {(reply.author?._id === selectedDoubt.author?._id || reply.author === selectedDoubt.author) && (
                              <span className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded font-black uppercase">
                                OP
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-textDim">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply textbox footer */}
              <div className="p-4 border-t border-white/5 bg-surface/50 backdrop-blur-md shrink-0">
                <form onSubmit={handleReplyDoubt} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your helpful reply here (earn +5 PTS)..."
                    className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 text-white placeholder-textDim"
                  />
                  <button 
                    type="submit"
                    disabled={replying || !replyContent.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold p-2.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                  >
                    {replying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            // No selected doubt state
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/5 mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join Classroom Discussion</h3>
              <p className="text-sm text-textDim max-w-sm leading-relaxed">
                Choose a doubt from the feed list on the left to read replies, upvote crucial questions, or contribute answers to earn 5 points.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Ask Doubt Modal */}
      <AnimatePresence>
        {showAskModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-surface border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAskModal(false)}
                className="absolute top-4 right-4 text-textDim hover:text-white"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <HelpCircle className="text-blue-400" /> Ask a Student Doubt
              </h2>
              <p className="text-xs text-textDim mb-4">
                Classmates and moderators will reply to help you. Posting a doubt awards you <span className="text-green-400 font-bold">+2 points</span>.
              </p>
              
              <form onSubmit={handleAskDoubt} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-textDim mb-1 uppercase tracking-wider">Your Question</label>
                  <textarea 
                    required 
                    value={newQuestion} 
                    onChange={e => setNewQuestion(e.target.value)} 
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 text-white min-h-[100px]" 
                    placeholder="e.g. How do we parse OCR response parameters in the backend user helper module?" 
                  />
                </div>

                <button 
                  disabled={asking || !newQuestion.trim()} 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all shadow-md shadow-blue-500/25 flex justify-center mt-2"
                >
                  {asking ? <Loader2 className="animate-spin w-5 h-5" /> : 'Post Doubt'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
