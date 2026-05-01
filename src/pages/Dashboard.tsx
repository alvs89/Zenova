import React from 'react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Task } from '@/types';
import { CheckCircle2, Circle, Flame, ArrowRight, PlayCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router';

export function Dashboard() {
  const { tasks, updateTask, streak, studyHistory } = useAppContext();
  const { user } = useAuth();

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const chartData = React.useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const offset = d.getTimezoneOffset() * 60000;
      const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
      
      const record = studyHistory.find(r => r.date === dateStr);
      const hours = record ? Number((record.minutes / 60).toFixed(1)) : 0;
      
      days.push({
        name: format(d, 'EEE'),
        hours
      });
    }
    return days;
  }, [studyHistory]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => {
    if (!t.date) return true;
    if (!t.completed) return t.date <= todayStr;
    return t.date === todayStr;
  });
  
  const pendingTodayTasks = todayTasks.filter(t => !t.completed);
  const urgentTasks = pendingTodayTasks.filter(t => t.priority === 'urgent');

  return (
    <div className="p-4 md:p-10 pb-8 md:pb-10 max-w-[1400px] mx-auto min-h-[calc(100vh-80px)]">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Hi, {user?.displayName?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 md:mt-3 text-base md:text-lg">
             {format(new Date(), 'EEEE, MMMM do')}
             <span className="block md:inline md:ml-1">You have {pendingTodayTasks.length} {pendingTodayTasks.length === 1 ? 'task' : 'tasks'} pending today.</span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1.5 rounded-full">
            <Flame size={20} className={streak > 0 ? "fill-orange-500" : ""} />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {streak} Day Streak
          </span>
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* TIMER COLUMN */}
        <div className="md:col-span-12 xl:col-span-4 flex flex-col gap-6 xl:row-span-2">
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] p-2 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
            <PomodoroTimer />
          </div>
        </div>

        {/* STUDY PATTERNS (CHART) */}
        <div className="md:col-span-12 xl:col-span-8 bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Study Patterns</h2>
               <p className="text-sm text-slate-500 mt-1">Your focus hours over the last 7 days</p>
             </div>
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">
               <BarChart3 size={24} />
             </div>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} />
                 <Tooltip 
                   cursor={{ fill: 'currentColor', opacity: 0.04 }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px', fontWeight: 500 }}
                   wrapperClassName="dark:text-slate-900 outline-none"
                   itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                 />
                 <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1000} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* TODAY'S FOCUS LIST */}
        <div className="md:col-span-12 xl:col-span-5 bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Today's Focus</h2>
            <Link to="/planner" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 group">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 pb-2 pt-1 -mx-2 px-2">
            {todayTasks.length === 0 ? (
              <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                 <CheckCircle2 size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
                 <p>All caught up for today!</p>
              </div>
            ) : (
              todayTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 group",
                    task.completed ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 hover:translate-y-0" :
                    task.priority === 'urgent' ? "bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 hover:border-red-300 shadow-sm hover:shadow-md" :
                    task.priority === 'important' ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-300 shadow-sm hover:shadow-md" :
                    "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm hover:shadow-md"
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="mt-0.5 relative flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {task.completed ? <CheckCircle2 size={22} className="text-slate-400" /> : <Circle size={22} className="opacity-40 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-base font-medium break-words", task.completed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-slate-200")}>
                      {task.title}
                    </p>
                    {!task.completed && task.priority !== 'optional' && (
                      <div className="mt-2 flex gap-2">
                         <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase",
                          task.priority === 'urgent' ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" :
                          "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* URGENT HIGHLIGHT OR MOTIVATION */}
        <div className="md:col-span-12 xl:col-span-3 rounded-[2rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            {urgentTasks.length > 0 ? (
              <>
                <div className="bg-red-500/20 text-red-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4 border border-red-500/30">
                  Needs Attention
                </div>
                <h3 className="text-3xl font-light leading-tight mb-2">
                  <span className="font-bold">{urgentTasks.length} urgent</span> tasks pending.
                </h3>
                <p className="text-indigo-100 text-sm mb-6 opacity-90">Let's knock them out. Focus on one thing at a time.</p>
                <div className="space-y-3">
                  {urgentTasks.slice(0, 2).map(ut => (
                    <div key={ut.id} className="bg-black/20 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words leading-tight">{ut.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-4 border border-emerald-500/30">
                  All Clear
                </div>
                <h3 className="text-3xl font-light leading-tight mb-4">
                  No <span className="font-bold">urgent</span> tasks today.
                </h3>
                <p className="text-indigo-100 text-base opacity-90 mb-8">Take a moment to review upcoming deadlines or use this time for deliberate practice.</p>
                <Link to="/wellness" className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Check In <PlayCircle size={16} />
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
