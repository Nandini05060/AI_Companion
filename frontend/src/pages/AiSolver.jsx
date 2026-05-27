import { useState } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';

export default function AiSolver({ user }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name.split(' ')[0]}! I am your AI Campus Companion. You can ask me to explain concepts, summarize notes, or help structure your study plan.` }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if(!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, I encountered an error connecting to my brain. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="glass flex-1 rounded-2xl flex flex-col overflow-hidden relative">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
             <div key={i} className={clsx("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                 <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === 'user' ? "bg-gradient-to-tr from-primary to-primaryHover" : "bg-white/10"
                 )}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                 </div>
                 <div className={clsx(
                    "p-4 rounded-2xl",
                    msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-surface/50 border border-white/5 rounded-tl-none"
                 )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                 </div>
             </div>
          ))}
          {loading && (
             <div className="flex gap-4 max-w-3xl mr-auto">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-white/10">
                    <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="p-4 rounded-2xl bg-surface/50 border border-white/5 rounded-tl-none">
                    <Loader2 className="w-4 h-4 text-textDim animate-spin" />
                 </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-background/50 backdrop-blur-sm">
           <div className="max-w-4xl mx-auto relative flex items-center">
              <input 
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Ask about a concept, paste a doubt, or request a summary..."
                 disabled={loading}
                 className="w-full bg-surface border border-white/10 rounded-full pl-6 pr-14 py-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors shadow-inner disabled:opacity-50"
              />
              <button 
                 onClick={handleSend}
                 disabled={loading}
                 className="absolute right-2 p-2.5 bg-primary hover:bg-primaryHover disabled:hover:bg-primary disabled:opacity-50 text-white rounded-full transition-all shadow-lg shadow-primary/20"
              >
                  <Send className="w-4 h-4" />
              </button>
           </div>
        </div>
        
      </div>
    </div>
  );
}
