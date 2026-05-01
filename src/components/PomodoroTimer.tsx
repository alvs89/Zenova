import React from 'react';
import { Play, Pause, RotateCcw, Brain, Coffee, CloudRain, Radio, Plane, VolumeX, Music, Headphones, Flame, Trees, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAppContext } from '@/context/AppContext';

export function PomodoroTimer() {
  const { 
    settings, 
    focusStats, 
    timerMode: mode, 
    timerTimeLeft: timeLeft, 
    timerIsRunning: isRunning, 
    toggleTimer, 
    resetTimer, 
    skipBreak,
    activeSoundId,
    setActiveSoundId,
    isAlarmRinging,
    stopAlarm
  } = useAppContext();
  
  // We recreate the array locally just for icons, since AppContext's array doesn't have lucide icons to avoid circular/fat deps
  const AMBIENT_SOUNDS = [
    { id: 'none', label: 'No Sound', icon: VolumeX },
    { id: 'rain', label: 'Rain', icon: CloudRain },
    { id: 'cafe', label: 'Cafe', icon: Coffee },
    { id: 'white_noise', label: 'White Noise', icon: Radio },
    { id: 'airport', label: 'Airport', icon: Plane },
    { id: 'forest', label: 'Forest', icon: Trees },
    { id: 'lofi', label: 'Lo-fi', icon: Headphones },
    { id: 'campfire', label: 'Campfire', icon: Flame }
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  };

  const totalTime = mode === 'focus' ? settings.focusDuration * 60 : settings.breakDuration * 60;
  const progress = Math.min(100, Math.max(0, (timeLeft / totalTime) * 100));
  const isWarning = mode === 'focus' && timeLeft > 0 && timeLeft <= Math.min(60, totalTime * 0.25);

  const getGradientColors = () => {
    if (mode === 'break') {
      return { start: '#4ade80', end: '#059669' }; 
    }
    if (isWarning || isAlarmRinging) {
      return { start: '#f87171', end: '#dc2626' }; 
    }
    if (progress < 33) {
      return { start: '#fbbf24', end: '#d97706' }; 
    }
    return { start: '#818cf8', end: '#4f46e5' }; 
  };

  const colors = getGradientColors();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col items-center max-w-sm w-full mx-auto relative overflow-hidden transition-colors">
      <div className={cn(
        "absolute -inset-20 opacity-10 blur-3xl rounded-full transition-colors duration-1000",
        mode === 'focus' ? ((isWarning || isAlarmRinging) ? "bg-red-400" : "bg-indigo-400") : "bg-emerald-400"
      )} />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6 sm:mb-8">
          <div className={cn("px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors", 
            mode === 'focus' ? ((isWarning || isAlarmRinging) ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300") : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          )}>
            {mode === 'focus' ? <Brain size={16} /> : <Coffee size={16} />}
            {mode === 'focus' ? 'Focus Session' : 'Quick Break'}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
            {focusStats.sessionsCompleted} <span className="opacity-50">Done</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8 sm:mb-10 w-full relative">
          <div className="relative w-full max-w-[16rem] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.start} className="transition-colors duration-1000" />
                  <stop offset="100%" stopColor={colors.end} className="transition-colors duration-1000" />
                </linearGradient>
              </defs>
              <circle 
                cx="128" cy="128" r="120" 
                fill="none" 
                className="stroke-slate-100 dark:stroke-slate-800/50"
                strokeWidth="12"
              />
              <motion.circle 
                cx="128" cy="128" r="120" 
                fill="none" 
                stroke="url(#timerGradient)"
                strokeWidth="12" 
                strokeDasharray="753.98" 
                animate={{
                  strokeDashoffset: 753.98 - (progress / 100) * 753.98
                }}
                transition={{
                  strokeDashoffset: {
                    duration: isRunning ? 1.05 : 0,
                    ease: "linear"
                  }
                }}
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-4 sm:inset-5 flex flex-col items-center justify-center z-10 bg-white dark:bg-slate-900 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] transition-colors">
              <motion.div 
                key={mode}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("text-5xl sm:text-6xl font-black tracking-tighter transition-colors", 
                  (isWarning || isAlarmRinging) ? "text-red-600 dark:text-red-400 animate-pulse" : "text-slate-800 dark:text-slate-100"
                )}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 sm:mt-2 text-center px-2">
                {mode === 'focus' ? ((isWarning || isAlarmRinging) ? 'Almost Done!' : 'Time Remaining') : 'Relax'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[360px]">
          {isAlarmRinging ? (
            <button 
              onClick={stopAlarm}
              className="flex-1 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-lg font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap focus:ring-4 focus:ring-red-100 animate-pulse"
            >
              <BellOff size={20} /> Stop Alarm
            </button>
          ) : (
            <button 
              onClick={toggleTimer}
              className={cn(
                "flex-1 w-full py-3.5 text-white rounded-xl text-lg font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap",
                mode === 'focus' ? (isWarning ? "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-100" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100") : "bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-100"
              )}
            >
              {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              {isRunning ? "Pause Timer" : "Start Timer"}
            </button>
          )}
          
          <button 
            onClick={resetTimer}
            disabled={isAlarmRinging}
            className="flex-1 w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw size={20} />
            Reset Timer
          </button>
        </div>

        {mode === 'break' && !isAlarmRinging && (
          <button
            onClick={skipBreak}
            className="mt-6 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors underline underline-offset-4"
          >
            Skip Break & Return to Focus
          </button>
        )}

        {!isRunning && timeLeft !== totalTime && mode !== 'break' && !isAlarmRinging && (
           <p className="text-center text-sm text-slate-400 mt-6 animate-pulse font-medium">
             Timer Paused
           </p>
        )}
        {mode === 'break' && isRunning && !isAlarmRinging && (
           <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 mt-4 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-4 py-1.5 rounded-full">
             Great job! Stretch your legs.
           </p>
         )}

        {mode === 'focus' && (
          <div className="mt-6 w-full pt-6 border-t border-slate-100 dark:border-slate-800/50">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-2">
              <Music size={14} /> Background Sound
            </h4>
            <div className="flex justify-center gap-2 flex-wrap">
              {AMBIENT_SOUNDS.map(sound => {
                const Icon = sound.icon;
                const isActive = activeSoundId === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => setActiveSoundId(sound.id)}
                    className={cn(
                      "p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all text-xs font-medium",
                      isActive 
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                    title={sound.label}
                  >
                    <Icon size={18} />
                    <span className="text-[9px] sm:text-[10px]">{sound.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
