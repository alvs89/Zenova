import React, { useState } from 'react';
import { TaskPriority, Task, TaskAttachment } from '@/types';
import { Plus, Sparkles, CheckCircle2, Circle, AlertCircle, Calendar, Trash2, List as ListIcon, Paperclip, ChevronDown, ChevronUp, X, AlignLeft, CheckSquare, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { suggestStudySchedule } from '@/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/context/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CalendarView } from '@/components/CalendarView';
import { EditTaskModal } from '@/components/EditTaskModal';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { format } from 'date-fns';

export function Planner() {
  const { tasks, addTask: contextAddTask, updateTask, removeTask, aiSchedule, setAiSchedule } = useAppContext();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('important');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskSubTasks, setNewTaskSubTasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newTaskAttachments, setNewTaskAttachments] = useState<{ name: string; mimeType: string; data: string }[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showAdvancedInput, setShowAdvancedInput] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    contextAddTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      date: newTaskDate,
      description: newTaskDescription.trim() || undefined,
      subTasks: newTaskSubTasks,
      attachments: newTaskAttachments
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskSubTasks([]);
    setNewTaskAttachments([]);
    setShowAdvancedInput(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const handleDeleteClick = (id: string) => {
    setTaskIdToDelete(id);
  };

  const confirmDelete = () => {
    if (taskIdToDelete) {
      removeTask(taskIdToDelete);
      setTaskIdToDelete(null);
    }
  };

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    setNewTaskSubTasks([...newTaskSubTasks, { id: Date.now().toString(), title: newSubTaskTitle.trim(), completed: false }]);
    setNewSubTaskTitle('');
  };

  const handleRemoveSubTask = (id: string) => {
    setNewTaskSubTasks(newTaskSubTasks.filter(st => st.id !== id));
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    Array.from(files).forEach(file => {
      // 10MB limit per file independently
      if (file.size > 10 * 1024 * 1024) {
         setAttachmentError(`File ${file.name} is too large. Maximum size is 10MB per file.`);
         return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setNewTaskAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: event.target?.result as string,
            size: file.size,
            idbId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx: number) => {
    setNewTaskAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subTasks) return;
    
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    updateTask(taskId, { subTasks: updatedSubTasks });
  };

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setAiSchedule(null);
    const suggestion = await suggestStudySchedule(tasks.filter(t => !t.completed));
    setAiSchedule(suggestion);
    setIsGenerating(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterStatus === 'pending' && task.completed) return false;
    return true;
  });

  const sortedFilteredTasks = [...filteredTasks].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="p-4 md:p-10 pb-6 md:pb-10 max-w-6xl mx-auto space-y-6 md:space-y-8 min-h-[calc(100vh-80px)]">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="text-indigo-600 dark:text-indigo-400" size={32} />
            Smart Task Planner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your deadlines and let AI optimize your study time.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setViewMode('list')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <ListIcon size={16} /> List
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all", viewMode === 'calendar' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
          >
            <Calendar size={16} /> Calendar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Col: Add Task & Task List */}
        <div className={cn("space-y-6", viewMode === 'calendar' && "lg:col-span-2")}>
          <form onSubmit={addTask} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="What do you need to do?"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onFocus={() => setShowAdvancedInput(true)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-4 md:text-base text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>
              <input
                type="date"
                value={newTaskDate}
                onChange={e => setNewTaskDate(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl px-4 py-3 md:px-5 md:py-4 md:text-base text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-200"
              />
            </div>
            
            <AnimatePresence>
              {showAdvancedInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                      <AlignLeft className="text-slate-400 mt-3" size={20} />
                      <textarea
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        placeholder="Add description..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-slate-800 dark:text-slate-200 min-h-[80px] resize-none"
                      />
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckSquare className="text-slate-400 mt-3" size={20} />
                      <div className="w-full space-y-2">
                        {newTaskSubTasks.map(st => (
                          <div key={st.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm min-w-0">
                            <span className="text-slate-700 dark:text-slate-300 break-words flex-1 min-w-0">{st.title}</span>
                            <button type="button" onClick={() => handleRemoveSubTask(st.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0"><X size={16} /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newSubTaskTitle}
                            onChange={e => setNewSubTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubTask(); } }}
                            placeholder="Add sub-task..."
                            className="flex-1 bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <button type="button" onClick={handleAddSubTask} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"><Plus size={18}/></button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pl-8">
                       {newTaskAttachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {newTaskAttachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                                <span className="truncate max-w-[120px]" title={att.name}>{att.name}</span>
                                <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                              </div>
                            ))}
                          </div>
                       )}
                       <div>
                         <input type="file" id="task-attachment" multiple className="hidden" onChange={handleAttachmentUpload} />
                         <label htmlFor="task-attachment" className="inline-flex flex-row items-center cursor-pointer text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 gap-1.5 transition-colors">
                           <Paperclip size={16} /> Attach Files
                         </label>
                         {attachmentError && (
                           <div className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                             <AlertCircle size={12} /> {attachmentError}
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(['urgent', 'important', 'optional'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all border",
                      newTaskPriority === p 
                        ? p === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : p === 'important' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} /> Add
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                 <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                   <div className="flex items-center gap-3">
                     <h3 className="font-semibold text-slate-800 dark:text-white">Your Tasks</h3>
                     <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                       {filteredTasks.filter(t => !t.completed).length} pending
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <select 
                       value={filterStatus}
                       onChange={(e) => setFilterStatus(e.target.value)}
                       className="text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium min-w-[110px]"
                     >
                       <option value="all">All Status</option>
                       <option value="pending">Pending</option>
                       <option value="completed">Completed</option>
                     </select>
                     <select 
                       value={filterPriority}
                       onChange={(e) => setFilterPriority(e.target.value)}
                       className="text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium min-w-[120px]"
                     >
                       <option value="all">All Priorities</option>
                       <option value="urgent">Urgent</option>
                       <option value="important">Important</option>
                       <option value="optional">Optional</option>
                     </select>
                   </div>
                 </div>
                 <div className="p-3">
                   <AnimatePresence>
                     {tasks.length > 0 && sortedFilteredTasks.length === 0 && (
                       <p className="text-center text-slate-400 dark:text-slate-500 py-8">No tasks match your filters.</p>
                     )}
                     {tasks.length === 0 && (
                       <p className="text-center text-slate-400 dark:text-slate-500 py-8">No tasks yet. You're all caught up!</p>
                     )}
                     {sortedFilteredTasks.map(task => (
                       <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, margin: 0 }}
                        className={cn(
                          "group flex flex-col p-4 rounded-2xl border transition-colors mb-2 gap-4",
                          task.completed ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70" :
                          task.priority === 'urgent' ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50" :
                          task.priority === 'important' ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/50" :
                          "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        )}
                       >
                         <div className="flex flex-row items-center justify-between gap-2 md:gap-4 overflow-hidden">
                           <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                              <button onClick={() => toggleTask(task.id)} className={cn("mt-0.5 transition-colors flex-shrink-0", task.completed ? "text-slate-400 dark:text-slate-500" : task.priority === 'urgent' ? "text-red-400 hover:text-red-600 dark:hover:text-red-300" : task.priority === 'important' ? "text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>
                                {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                              </button>
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className={cn("font-semibold text-sm transition-all break-words", task.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200")}>
                                  {task.title}
                                </span>
                                {!task.completed && (
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 w-fit border",
                                    task.priority === 'urgent' ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800" :
                                    task.priority === 'important' ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" :
                                    "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                  )}>
                                    {task.priority === 'urgent' ? 'URGENT' : task.priority === 'important' ? 'IMPORTANT' : 'OPTIONAL'}
                                  </span>
                                )}
                              </div>
                           </div>
                           <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                             {(task.description || (task.subTasks && task.subTasks.length > 0) || (task.attachments && task.attachments.length > 0)) && (
                               <button 
                                 onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                 className="p-1 md:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                               >
                                 {expandedTaskId === task.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                               </button>
                             )}
                             {task.date && (
                               <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                 {format(new Date(task.date), 'MMM d')}
                               </span>
                             )}
                             <div className="flex items-center">
                               <button 
                                 onClick={() => setTaskToEdit(task)}
                                 className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                 title="Edit Task"
                               >
                                 <Pencil size={18} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteClick(task.id)}
                                 className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                 title="Delete Task"
                               >
                                 <Trash2 size={18} />
                               </button>
                             </div>
                           </div>
                         </div>
                         
                         <AnimatePresence>
                           {expandedTaskId === task.id && (
                             <motion.div
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               exit={{ opacity: 0, height: 0 }}
                               className="overflow-hidden"
                             >
                               <div className="pt-2 pb-1 pl-8 md:pl-9 space-y-4">
                                 {task.description && (
                                   <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                     {task.description}
                                   </div>
                                 )}
                                 
                                 {task.subTasks && task.subTasks.length > 0 && (
                                   <div className="space-y-2">
                                     {task.subTasks.map(st => (
                                       <div key={st.id} className="flex items-center gap-3 min-w-0">
                                         <button onClick={() => toggleSubTask(task.id, st.id)} className={cn("transition-colors flex-shrink-0", st.completed ? "text-slate-300 dark:text-slate-600" : "text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400")}>
                                           {st.completed ? <CheckSquare size={16} /> : <div className="w-4 h-4 border-2 border-current rounded-[4px]" />}
                                         </button>
                                         <span className={cn("text-sm break-words flex-1 min-w-0", st.completed ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300")}>
                                           {st.title}
                                         </span>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                                 
                                 {task.attachments && task.attachments.length > 0 && (
                                   <div className="flex flex-wrap gap-2 pt-1">
                                     {task.attachments.map((att, idx) => (
                                       <button type="button" onClick={() => setPreviewAttachment(att)} key={idx} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                         <Paperclip size={14} className="text-slate-400" />
                                         <span className="truncate max-w-[150px]">{att.name}</span>
                                       </button>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <CalendarView 
                  tasks={tasks}
                  selectedDate={newTaskDate}
                  onDateClick={(date) => {
                    setNewTaskDate(format(date, 'yyyy-MM-dd'));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onTaskClick={(task) => toggleTask(task.id)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: AI Schedule */}
        <AnimatePresence>
          {viewMode === 'list' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-1 shadow-lg h-fit border border-indigo-400/30"
            >
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[22px] p-8 h-full flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI Schedule Optimizer</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">
                Overwhelmed by your to-do list? Let AI build an optimized study plan based on priorities so you know exactly where to start.
              </p>
              
              {!aiSchedule ? (
                 <button 
                  onClick={handleGenerateSchedule}
                  disabled={isGenerating || tasks.filter(t => !t.completed).length === 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  {isGenerating ? 'Analyzing Priorities...' : 'Generate Study Plan'}
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
              ) : (
                <div className="text-left w-full bg-slate-50 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 p-6 rounded-2xl mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm">Suggested Plan</h3>
                    <button onClick={handleGenerateSchedule} className="px-3 py-1.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors flex items-center gap-1">Regenerate</button>
                  </div>
                    <div className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 shadow-none [&_table]:m-0 [&_table]:border-collapse [&_th]:whitespace-nowrap [&_th]:bg-slate-50 [&_th]:dark:bg-slate-800/80 [&_td]:align-middle">
                     <ReactMarkdown 
                       remarkPlugins={[remarkMath, remarkGfm]} 
                       rehypePlugins={[rehypeKatex]}
                       components={{
                         table: ({node, ...props}) => (
                           <div className="w-full overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                             <table className="w-full text-left border-collapse min-w-full" {...props} />
                           </div>
                         ),
                         th: ({node, ...props}) => (
                           <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700/50" {...props} />
                         ),
                         td: ({node, ...props}) => (
                           <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300" {...props} />
                         ),
                         p: ({node, ...props}) => (
                           <p className="whitespace-pre-wrap" {...props} />
                         )
                       }}
                     >
                       {aiSchedule.replace(/<br\s*\/?>/gi, '\n\n')}
                     </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {tasks.filter(t => !t.completed).length === 0 && !aiSchedule && (
                 <p className="mt-4 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-1"><AlertCircle size={14}/> Add active tasks to generate a plan</p>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        isOpen={taskIdToDelete !== null}
        onClose={() => setTaskIdToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
      <EditTaskModal 
        isOpen={taskToEdit !== null} 
        task={taskToEdit} 
        onClose={() => setTaskToEdit(null)} 
        onSave={(id, updates) => updateTask(id, updates)} 
      />
      <FilePreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
