import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  selectedDate: string;
}

export function CalendarView({ tasks, onDateClick, onTaskClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMoreDate, setViewMoreDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => t.date === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white pl-2">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 scrollbar-hide">
        <div className="min-w-[700px] h-full flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(140px,1fr)]">
            {days.map((date, i) => {
          const dateTasks = getTasksForDate(date);
          const isCurrentMonth = isSameMonth(date, monthStart);
          const activeDate = isSameDay(date, new Date());
          const isSelected = format(date, 'yyyy-MM-dd') === selectedDate;
          
          return (
            <div 
              key={date.toString()}
              onClick={() => onDateClick(date)}
              className={cn(
                "border-b border-r border-slate-100 dark:border-slate-800/50 p-2 cursor-pointer transition-colors group relative flex flex-col",
                !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/20",
                isCurrentMonth && !isSelected && "hover:bg-slate-50 dark:hover:bg-slate-800/30",
                isSelected && "bg-indigo-50/50 dark:bg-indigo-900/20 outline outline-1 outline-indigo-500",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "w-7 h-7 flex items-center justify-center text-sm rounded-full",
                  activeDate 
                    ? "bg-indigo-600 text-white font-bold" 
                    : !isCurrentMonth 
                      ? "text-slate-400 dark:text-slate-600" 
                      : "text-slate-700 dark:text-slate-300 font-medium"
                )}>
                  {format(date, 'd')}
                </span>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-opacity">
                  <Plus size={14} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto scrollbar-hide">
                {dateTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                    className={cn(
                      "px-2 py-1 text-xs truncate rounded-md border font-medium",
                      task.completed ? "opacity-60 line-through bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:opacity-100" :
                      task.priority === 'urgent' ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50" :
                      task.priority === 'important' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dateTasks.length > 3 && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); setViewMoreDate(date); }}
                    className="text-xs text-slate-500 pl-1 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    +{dateTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewMoreDate && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setViewMoreDate(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {format(viewMoreDate, 'MMMM d, yyyy')}
                </h3>
                <button onClick={() => setViewMoreDate(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide pr-1">
                {getTasksForDate(viewMoreDate).map(task => (
                  <div 
                    key={task.id}
                    onClick={() => { onTaskClick(task); }}
                    className={cn(
                      "px-3 py-2 text-sm rounded-xl border font-medium cursor-pointer transition-colors break-words leading-tight",
                      task.completed ? "opacity-60 line-through bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:opacity-100" :
                      task.priority === 'urgent' ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40" :
                      task.priority === 'important' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
