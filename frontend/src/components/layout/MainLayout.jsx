import { Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import ProfileSettingsModal from '../ProfileSettingsModal';

export default function MainLayout({ onLogout, user, updateUser }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  if (!user) return <Navigate to="/auth" />;
  
  return (
    <div className="flex h-screen overflow-hidden bg-background relative z-0">
      
      {/* Aesthetic Animated Background */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
         {/* Subtle Grid Pattern */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
         
         {/* Glowing Ambient Orbs */}
         <motion.div 
           className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]"
           animate={{ x: [0, -100, 50, 0], y: [0, 100, -50, 0], scale: [1, 1.2, 0.9, 1] }}
           transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
         />
         <motion.div 
           className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-primaryHover/10 rounded-full blur-[140px]"
           animate={{ x: [0, 150, -50, 0], y: [0, -150, 100, 0], scale: [1, 0.8, 1.1, 1] }}
           transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
         />
      </div>

      <Sidebar onProfileClick={() => setShowProfileModal(true)} user={user} />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-4 z-10">
        <Topbar user={user} />
        
        <div className="px-4 flex-1">
          <Outlet />
        </div>
      </main>

      {showProfileModal && (
        <ProfileSettingsModal 
          user={user} 
          updateUser={updateUser} 
          onClose={() => setShowProfileModal(false)} 
          onLogout={onLogout} 
        />
      )}
    </div>
  );
}
