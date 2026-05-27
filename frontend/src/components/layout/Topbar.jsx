import { Bell, Search, User as UserIcon } from 'lucide-react';

export default function Topbar({ user }) {
  return (
    <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-10 glass mx-4 mt-4 rounded-2xl mb-6">
      <div className="flex items-center gap-2 bg-surface/50 border border-white/5 rounded-xl px-4 py-2 w-96">
        <Search className="w-5 h-5 text-textDim" />
        <input 
          type="text" 
          placeholder="Search classes, notes, or AI..." 
          className="bg-transparent border-none outline-none text-sm w-full text-text placeholder:text-textDim"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors relative">
          <Bell className="w-5 h-5 text-textDim" />
        </button>
        <div className="flex items-center gap-3 glass px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primaryHover flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium pr-2">{user?.name || 'Student'}</span>
        </div>
      </div>
    </header>
  );
}
