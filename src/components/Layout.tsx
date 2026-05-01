import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, MessageSquare, Heart, Settings, Menu, X, BookOpen, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { SettingsModal } from './SettingsModal';
import { ConfirmModal } from './ConfirmModal';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/planner', icon: CalendarCheck, label: 'Planner' },
  { path: '/assistant', icon: MessageSquare, label: 'AI Study Lab' },
  { path: '/wellness', icon: Heart, label: 'Wellness' },
];

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const location = useLocation();
  const { streak } = useAppContext();
  const { user, logout } = useAuth();
  
  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'S';

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
            Zenova
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-4 mb-2 mx-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Daily Streak</span>
            <span className="text-lg">🔥 {streak}</span>
          </div>
          <div className="w-full bg-white dark:bg-slate-800 rounded-full h-2 mb-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(streak % 7) / 7 * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wide">
            {7 - (streak % 7)} days to next level
          </p>
        </div>

        <div className="px-4 pb-4 border-t border-transparent flex flex-col gap-1">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings size={20} />
            Settings
          </button>
          <button 
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 absolute top-0 w-full left-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden shadow-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
          <div>
             <span className="block font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">Zenova</span>
             <span className="block text-[10px] text-slate-500 font-medium tracking-wide">🔥 {streak} Day Streak</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-95 transition-transform"
          >
            <Settings size={22} />
          </button>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full active:scale-95 transition-transform"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay - Removed hamburger menu, replaced with bottom nav */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto w-full pt-16 pb-20 md:pt-0 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full py-1.5 px-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("mb-1 transition-transform", isActive ? "scale-110" : "")} />
                  <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        isDestructive={true}
      />
    </div>
  );
}
