import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Clock, BrainCircuit, CalendarDays, LogOut, MessageSquare, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BookOpen, label: 'Classroom', path: '/classroom' },
  { icon: MessageSquare, label: 'Doubt Portal', path: '/doubts' },
  { icon: Clock, label: 'Productivity', path: '/productivity' },
  { icon: BrainCircuit, label: 'AI Solver', path: '/ai' },
  { icon: CalendarDays, label: 'Timetable AI', path: '/timetable' },
];

export default function Sidebar({ onLogout, onProfileClick, user }) {
  return (
    <aside className="w-64 glass h-screen sticky top-0 flex flex-col pt-6 pb-4 px-4 m-4 rounded-2xl">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="font-bold text-white text-sm">AI</span>
        </div>
        <h1 className="font-bold text-lg tracking-tight">Campus<span className="text-primary">Companion</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {!user?.isAdmin && navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              isActive 
                ? "bg-primary text-white shadow-[0_0_15px_rgba(139,0,0,0.4)]" 
                : "text-textDim hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        {user?.isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-4",
              isActive 
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                : "text-blue-400 hover:text-white hover:bg-white/5"
            )}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="font-medium">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <button 
        onClick={onProfileClick}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-textDim hover:text-white hover:bg-white/10 transition-all duration-200 mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Profile / Settings</span>
      </button>
    </aside>
  );
}
