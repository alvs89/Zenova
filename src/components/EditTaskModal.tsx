import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, SubTask, TaskAttachment } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlignLeft, CheckSquare, Paperclip, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('optional');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setPriority(task.priority);
      setDate(task.date || '');
      setDescription(task.description || '');
      setSubTasks(task.subTasks || []);
      setAttachments(task.attachments || []);
      setNewSubTaskTitle('');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(task.id, {
      title: title.trim(),
      priority,
      date: date || undefined,
      description: description.trim(),
      subTasks,
      attachments
    });
    onClose();
  };

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim()) return;
    setSubTasks([...subTasks, { id: Date.now().toString(), title: newSubTaskTitle.trim(), completed: false }]);
    setNewSubTaskTitle('');
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
         setAttachmentError(`File ${file.name} is too large. Maximum size is 10MB per file.`);
         return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setAttachments(prev => [...prev, {
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
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 z-10">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Edit Task
            </h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
                   {(['urgent', 'important', 'optional'] as TaskPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg font-medium transition-all capitalize",
                        priority === p 
                          ? p === 'urgent' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 shadow-sm' 
                          : p === 'important' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlignLeft size={16} /> Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[100px] resize-y"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CheckSquare size={16} /> Sub-tasks
              </label>
              <div className="space-y-2">
                {subTasks.map(st => (
                  <div key={st.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm group">
                    <span className="text-slate-700 dark:text-slate-300">{st.title}</span>
                    <button type="button" onClick={() => handleRemoveSubTask(st.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubTaskTitle}
                    onChange={e => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubTask(); } }}
                    placeholder="Add a new sub-task..."
                    className="flex-1 bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                  <button type="button" onClick={handleAddSubTask} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Plus size={18}/>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Paperclip size={16} /> Attachments
              </label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 group">
                    <span className="truncate max-w-[180px] text-slate-700 dark:text-slate-300" title={att.name}>{att.name}</span>
                    <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                  </div>
                ))}
              </div>
              <div>
                <input type="file" id="edit-task-attachment" multiple className="hidden" onChange={handleAttachmentUpload} />
                <label htmlFor="edit-task-attachment" className="inline-flex flex-row items-center cursor-pointer text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors gap-2">
                  <Plus size={16} /> Add File
                </label>
                {attachmentError && (
                  <div className="text-red-500 text-xs mt-2 font-medium">
                    {attachmentError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-3xl">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
