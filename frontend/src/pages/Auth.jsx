import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, BookOpen, User as UserIcon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

export default function Auth({ handleLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sapId, setSapId] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      setIsLogin(location.state.isLogin);
    }
  }, [location.state]);

  // Check for verification token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('verify');
    if (token) {
      const verifyEmail = async () => {
        try {
          const { data } = await api.post('/auth/verify', { token });
          setSuccessMsg(data.message);
          setIsLogin(true);
          // Remove the verify query param from URL so it doesn't re-trigger
          navigate('/', { replace: true });
        } catch (err) {
          setError(err.response?.data?.message || 'Verification failed. Link might be expired.');
        }
      };
      verifyEmail();
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', { email, password });
        handleLogin(data, data.token);
      } else {
        const { data } = await api.post('/auth/register', { name, email, password, sapId });
        // Don't auto log in, just show success message
        setSuccessMsg(data.message);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${isAdminMode ? 'bg-blue-500/20' : 'bg-primary/20'} rounded-full blur-[120px] transition-colors duration-500`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 ${isAdminMode ? 'bg-indigo-500/20' : 'bg-primaryHover/20'} rounded-full blur-[120px] transition-colors duration-500`}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass w-full max-w-md p-8 rounded-2xl z-10 border transition-colors duration-500 ${isAdminMode ? 'border-blue-500/20' : 'border-white/10'}`}
      >
        <div className="flex flex-col items-center mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-colors duration-500 ${isAdminMode ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/20' : 'bg-gradient-to-tr from-primary to-primaryHover shadow-primary/20'}`}>
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {isAdminMode ? 'Admin Portal Login' : 'Welcome to AI Campus Companion'}
          </h1>
          <p className="text-textDim text-sm text-center">
            {isAdminMode ? 'Secure access for platform administrators.' : 'Your smart student platform for productivity and collaborative learning.'}
          </p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">{error}</div>}
        {successMsg && <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-sm p-3 rounded-xl mb-4 text-center flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/>{successMsg}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-textDim mb-1">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-4 w-5 h-5 text-textDim" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-textDim mb-1">SAP ID</label>
                <div className="relative flex items-center">
                  <BookOpen className="absolute left-4 w-5 h-5 text-textDim" />
                  <input 
                    type="text" 
                    value={sapId}
                    onChange={(e) => setSapId(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="70XXXXXXXXX"
                    required={!isLogin}
                  />
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-textDim mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-textDim" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="student@university.edu"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textDim mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-textDim" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full text-white font-medium py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-lg disabled:opacity-50
              ${isAdminMode ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' : 'bg-primary hover:bg-primaryHover shadow-primary/25'}
            `}
          >
            {loading ? 'Processing...' : (isLogin || isAdminMode ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {!isAdminMode && (
            <p className="text-sm text-textDim">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                className="ml-2 text-white hover:text-primary transition-colors font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}

          <div className="border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setIsLogin(true); // Always force login mode when toggling
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-textDim hover:text-white transition-colors"
            >
              {isAdminMode ? 'Return to Student Login' : 'Admin Portal Access'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
