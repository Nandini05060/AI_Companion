import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, CheckCircle, Clock, FileText, Brain, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Custom AI Cursor Tracking
  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    { icon: <Calendar className="w-6 h-6 text-primary" />, title: "Managing Timetable & Classes", description: "Keep track of all your classes and organize your daily schedule efficiently." },
    { icon: <CheckCircle className="w-6 h-6 text-primary" />, title: "Tracking Attendance", description: "Monitor your attendance dynamically so you never fall below the requirement." },
    { icon: <Clock className="w-6 h-6 text-primary" />, title: "Assignments & Deadlines", description: "Stay on top of due dates with smart reminders and unified task management." },
    { icon: <FileText className="w-6 h-6 text-primary" />, title: "Organizing Notes", description: "Store, share, and collaborate on your class notes seamlessly in one place." },
    { icon: <BookOpen className="w-6 h-6 text-primary" />, title: "Preparing for Exams", description: "Access aggregated study materials and effectively track your exam readiness." },
    { icon: <Brain className="w-6 h-6 text-primary" />, title: "Quick Doubt Solutions", description: "Ask our advanced AI tutor to help resolve complex problems step-by-step." }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background text-text relative">
      
      {/* SHINING MOVING AI CURSOR GLOW */}
      <motion.div 
        className="fixed top-0 left-0 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none z-50 mix-blend-screen"
        animate={{ x: mousePosition.x - 128, y: mousePosition.y - 128 }}
        transition={{ type: "spring", damping: 40, stiffness: 200, mass: 0.5, bounce: 0 }}
      />
      
      {/* ANIMATED BACKGROUND BLOBS */}
      <motion.div 
        className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none"
        animate={{ 
          x: [0, 200, -100, 0], 
          y: [0, -150, 100, 0],
          scale: [1, 1.2, 0.8, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        style={{ top: '-10%', left: '-5%' }}
      />
      <motion.div 
         className="absolute w-[500px] h-[500px] bg-primaryHover/10 rounded-full blur-[120px] -z-10 pointer-events-none"
         animate={{ 
           x: [0, -200, 150, 0], 
           y: [0, 200, -100, 0],
           scale: [1, 0.9, 1.1, 1]
         }}
         transition={{ duration: 25, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
         style={{ bottom: '-10%', right: '-5%' }}
      />

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Side: Text and CTA */}
        <motion.div 
          className="flex-1 space-y-8 z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-primary font-medium border-primary/20 bg-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            AI Campus Companion v1.0
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold leading-tight">
            Your Ultimate <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primaryHover">
              Student Hub
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg text-textDim max-w-xl leading-relaxed">
            Boost your productivity, collaborate seamlessly with peers, and conquer complex subjects with our AI-powered study ecosystem designed for modern learners.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => navigate('/auth', { state: { isLogin: false } })}
              className="px-8 py-4 bg-primary hover:bg-primaryHover text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 flex items-center gap-2 hover:scale-105"
            >
              Get Started for Free <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/auth', { state: { isLogin: true } })}
              className="px-8 py-4 glass text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/10 hover:scale-105"
            >
              Log me in
            </button>
          </motion.div>
        </motion.div>

        {/* Right Side: Robot Image */}
        <motion.div 
          className="flex-1 relative w-full max-w-lg z-10 mx-auto mt-10 lg:mt-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* AI Robot Speech Bubble */}
          <motion.div
             className="absolute top-4 right-4 md:right-10 glass px-6 py-4 rounded-3xl rounded-br-none border-primary/30 shadow-xl shadow-primary/10 text-xl font-bold z-20 flex items-center gap-2 bg-background/80 backdrop-blur-xl"
             initial={{ opacity: 0, scale: 0, y: 20, rotate: -10 }}
             animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
             transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
          >
            <span className="animate-wave inline-block origin-bottom-right">👋</span> Hi there!
          </motion.div>

          {/* Floating Robot */}
          <motion.div
             animate={{ y: [0, -20, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img 
              src="/assets/robot.png" 
              alt="AI Companion Robot" 
              className="w-full h-auto drop-shadow-[0_0_80px_rgba(139,0,0,0.4)] relative z-10"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Features Overview */}
      <motion.div 
        className="max-w-7xl mx-auto px-6 pb-20 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass p-8 rounded-2xl hover:bg-white/5 border border-white/5 hover:border-primary/30 transition-all duration-300 group shadow-lg"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-textDim text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
