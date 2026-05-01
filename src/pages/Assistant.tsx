import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Edit2, Trash2, Check, X, Paperclip, FileText, Image as ImageIcon, Plus, MessageSquare, MoreVertical, Menu, Copy } from 'lucide-react';
import { ChatMessage, ChatSession } from '@/types';
import { generateChatResponse, generateChatTitle } from '@/services/geminiService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import { get as idbGet } from 'idb-keyval';

export function Assistant() {
  const { 
    chatSessions, 
    activeChatId, 
    setActiveChatId,
    createChatSession,
    updateChatTitle,
    deleteChatSession,
    addMessage,
    updateMessage,
    removeMessage,
    setSessionMessages,
    tasks
  } = useAppContext();
  
  const { user } = useAuth();
  
  const activeSession = chatSessions.find(s => s.id === activeChatId);
  const messages = activeSession?.messages || [];

  const [input, setInput] = useState('');
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState('');

  const [typingChatId, setTypingChatId] = useState<string | null>(null);
  const [typingTitle, setTypingTitle] = useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close sidebar when chat changes on mobile
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeChatId]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopThinking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoadingChatId(null);
    }
  };

  const handleNewChat = () => {
    createChatSession();
  };

  const saveChatTitle = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editChatTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    updateChatTitle(id, editChatTitle.trim());
    setEditingChatId(null);
  };

  const deleteChat = (id: string) => {
    deleteChatSession(id);
    setChatToDelete(null);
  };

  const [attachments, setAttachments] = useState<{name: string, data?: string, mimeType: string, size?: number, idbId?: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          const base64Data = event.target.result.split(',')[1];
          setAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64Data,
            size: file.size,
            idbId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result && typeof event.target.result === 'string') {
              const base64Data = event.target.result.split(',')[1];
              setAttachments(prev => [...prev, {
                name: file.name || `pasted_image_${Date.now()}.png`,
                mimeType: file.type || 'image/png',
                data: base64Data,
                size: file.size,
                idbId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
              }]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingChatId, activeChatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCurrentlyLoading = loadingChatId === activeChatId;
    if ((!input.trim() && attachments.length === 0) || isCurrentlyLoading) return;
    if (!activeChatId) return;

    const userMsgData: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content: input.trim() || 'Please check the attached files.',
    };
    if (attachments.length > 0) {
      userMsgData.attachments = attachments;
    }

    await addMessage(activeChatId, userMsgData);
    
    // Optimistic message append for immediate UI feedback while api call processes
    // Wait, addMessage doesn't automatically return the new message array immediately in state since it goes to Firestore.
    // That's fine, we will just show generating while the snapshot updates.

    setInput('');
    setAttachments([]);
    setLoadingChatId(activeChatId);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Create chat history for context
      const allMessages = messages.concat({ id: 'temp', timestamp: Date.now(), ...userMsgData });
      const chatHistoryForAPI = await Promise.all(allMessages.map(async m => {
        let processedAttachments;
        if (m.attachments) {
          const resolved = await Promise.all(m.attachments.map(async att => {
            if (att.data) return att;
            if (att.idbId) {
              try {
                const data = await idbGet(att.idbId);
                if (typeof data === 'string') {
                  return { ...att, data };
                }
              } catch(e) { console.error('Failed to load idb', e); }
            }
            return att;
          }));
          processedAttachments = resolved.filter(a => a.data);
        }
        return {
          role: m.role,
          content: m.content,
          attachments: processedAttachments?.length ? processedAttachments : undefined
        };
      }));
      
      const contextStr = `Application Name: Zenova\nUser's Display Name: ${user?.displayName || 'Student'}\n${tasks.length > 0 ? `User's current planner tasks:\n${JSON.stringify(tasks, null, 2)}` : 'User has no tasks currently.'}`;
      const response = await generateChatResponse(chatHistoryForAPI, contextStr, controller.signal);
      if (controller.signal.aborted) {
        console.log('Response generation aborted by user.');
        return;
      }
      await addMessage(activeChatId, { role: 'assistant', content: response });

      const isFirstUserMsg = !messages.some(m => m.role === 'user');
      if (isFirstUserMsg) {
        generateChatTitle(userMsgData.content).then(title => {
          const targetChatId = activeChatId;
          setTypingChatId(targetChatId);
          let currentChars = "";
          const characters = title.split('');
          let i = 0;
          const interval = setInterval(() => {
            currentChars += characters[i];
            setTypingTitle(currentChars);
            i++;
            if (i === characters.length) {
              clearInterval(interval);
              setTimeout(() => {
                updateChatTitle(targetChatId, title);
                setTypingChatId(null);
                setTypingTitle('');
              }, 400);
            }
          }, 40);
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('Response generation aborted by user.');
      } else {
        console.error(error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoadingChatId(null);
      }
    }
  };

  const handleEditClick = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim() || !activeChatId) return;
    
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex === -1) return;

    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], content: editContent.trim() };
    
    setEditingId(null);
    setEditContent('');

    const newChatHistory = updatedMessages.slice(0, messageIndex + 1);
    setLoadingChatId(activeChatId);
    await setSessionMessages(activeChatId, newChatHistory);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const chatHistoryForAPI = newChatHistory.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const contextStr = `Application Name: Zenova\nUser's Display Name: ${user?.displayName || 'Student'}\n${tasks.length > 0 ? `User's current planner tasks:\n${JSON.stringify(tasks, null, 2)}` : 'User has no tasks currently.'}`;
      const response = await generateChatResponse(chatHistoryForAPI, contextStr, controller.signal);
      if (controller.signal.aborted) {
        console.log('Response generation aborted by user.');
        return;
      }
      await addMessage(activeChatId, { role: 'assistant', content: response });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('Response generation aborted by user.');
      } else {
        console.error(error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoadingChatId(null);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setMessageToDelete(id);
  };

  const copyMessage = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedMessageId(msg.id);
      window.setTimeout(() => {
        setCopiedMessageId(currentId => currentId === msg.id ? null : currentId);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const confirmDelete = () => {
    if (messageToDelete && activeChatId) {
      removeMessage(activeChatId, messageToDelete);
      setMessageToDelete(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full max-w-[1400px] mx-auto p-0 pb-2 md:px-6 md:pt-6 md:pb-2 lg:px-10 lg:pt-10 lg:pb-4 gap-0 md:gap-6 relative">
      {/* SIDEBAR FOR CHAT SESSIONS */}
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 transform transition-transform duration-300 md:relative md:inset-auto md:z-auto md:w-64 lg:w-72 md:bg-transparent md:dark:bg-transparent md:border-none md:p-0 md:transform-none md:flex-shrink-0 flex flex-col gap-2 md:gap-4",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between md:hidden mb-2">
          <h2 className="font-bold text-slate-800 dark:text-slate-200">Chats</h2>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 flex-shrink-0 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-colors border border-indigo-500 shadow-sm"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto bg-transparent md:bg-white md:dark:bg-slate-900 md:rounded-3xl md:p-3 md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-800 scrollbar-hide space-y-2 mt-2 md:mt-0">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Recent Chats</h2>
          {chatSessions.map(session => (
            <div 
              key={session.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors border",
                activeChatId === session.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm" 
                  : "bg-white dark:bg-slate-800 md:bg-transparent border-slate-200 dark:border-slate-700 md:border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
              )}
              onClick={() => setActiveChatId(session.id)}
            >
              {editingChatId === session.id ? (
                <form onSubmit={(e) => saveChatTitle(session.id, e)} className="flex-1 flex items-center gap-2">
                  <MessageSquare size={16} className="opacity-50 flex-shrink-0" />
                  <input 
                    type="text" 
                    value={editChatTitle}
                    onChange={e => setEditChatTitle(e.target.value)}
                    autoFocus
                    onBlur={() => saveChatTitle(session.id)}
                    className="w-full bg-white dark:bg-slate-800 border-indigo-300 border text-sm rounded px-1.5 py-0.5 focus:outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                </form>
              ) : (
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare size={16} className="opacity-60 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {typingChatId === session.id ? (
                      <>{typingTitle}<span className="inline-block w-1 h-3.5 ml-0.5 align-baseline bg-current animate-pulse"></span></>
                    ) : session.title}
                  </span>
                </div>
              )}
              
              {editingChatId !== session.id && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingChatId(session.id); setEditChatTitle(session.title); }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setChatToDelete(session.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 md:rounded-3xl shadow-sm md:border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden relative z-10 h-full border-t">
        <div className="flex items-center gap-3 p-3 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 mr-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl hidden md:block">
            <Bot size={24} />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{activeSession?.title || 'AI Study Assistant'}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Ask me to explain concepts, summarize notes, or quiz you.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" key={activeChatId}>
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 max-w-[95%] sm:max-w-[85%] text-sm group",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {msg.role === 'user' ? (
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`} alt="User" className="flex-shrink-0 w-8 h-8 rounded-xl object-cover mt-1" />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs mt-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    AI
                  </div>
                )}
                
                <div className="flex flex-col gap-1 max-w-full break-words">
                  <div className={cn(
                    "px-4 py-3 rounded-2xl leading-relaxed w-fit max-w-full break-words overflow-x-auto",
                    msg.role === 'user' 
                      ? "self-end bg-indigo-600 text-white rounded-tr-none shadow-sm whitespace-pre-wrap" 
                      : "self-start bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800"
                  )}>
                    {editingId === msg.id ? (
                      <div className="flex flex-col gap-2 w-full overflow-hidden box-border">
                        <textarea
                          value={editContent}
                          onChange={e => {
                            setEditContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          className={cn(
                            "w-full max-w-full box-border bg-transparent border-b resize-none focus:outline-none p-1 block",
                            msg.role === 'user' ? "border-indigo-400 text-white placeholder:text-indigo-300" : "border-slate-300 dark:border-slate-600 focus:border-indigo-500 text-slate-900 dark:text-white"
                          )}
                          rows={1}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <button onClick={cancelEdit} className={cn("p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors", msg.role === 'user' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400')}>
                            <X size={14} />
                          </button>
                          <button onClick={() => saveEdit(msg.id)} className={cn("p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors", msg.role === 'user' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400')}>
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      msg.role === 'user' ? (
                        <div className="flex flex-col gap-2">
                          {msg.content && <span>{msg.content}</span>}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {msg.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-white/20 text-white py-1 px-2.5 rounded-lg text-xs font-medium">
                                  {file.mimeType.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                                  <span className="truncate max-w-[120px]">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none overflow-hidden">
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath, remarkGfm]} 
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              table: ({node, ...props}) => (
                                <div className="overflow-x-auto w-full my-4">
                                  <table className="w-full text-left border-collapse" {...props} />
                                </div>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )
                    )}
                  </div>
                  
                  {editingId !== msg.id && (
                    <div className={cn(
                      "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <button
                        onClick={() => copyMessage(msg)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={copiedMessageId === msg.id ? "Copied" : "Copy message"}
                        aria-label={copiedMessageId === msg.id ? "Message copied" : "Copy message"}
                      >
                        {copiedMessageId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      {msg.role === 'user' && (
                        <button onClick={() => handleEditClick(msg)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Edit message">
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteClick(msg.id)} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete message">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loadingChatId === activeChatId && (
               <motion.div
               key="loading-indicator"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="flex gap-3 max-w-[85%] mr-auto"
             >
               <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs mt-1">
                 AI
               </div>
               
               <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-tl-none flex items-center gap-2">
                 <Loader2 className="animate-spin text-slate-400" size={16} />
                 <span className="text-slate-500 dark:text-slate-400 text-sm">Thinking...</span>
               </div>
             </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 py-1.5 px-3 rounded-full text-xs font-medium">
                  {file.mimeType.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(idx)} className="hover:text-red-500 ml-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingChatId === activeChatId}
              className="absolute left-2 top-2 bottom-2 aspect-square text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors flex items-center justify-center p-2 rounded-xl"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Ask about your lesson..."
              disabled={loadingChatId === activeChatId}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            {loadingChatId === activeChatId ? (
              <button
                type="button"
                onClick={stopThinking}
                className="absolute right-2 top-2 bottom-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center space-x-1"
                title="Stop Thinking"
              >
                <div className="w-3 h-3 bg-current rounded-sm"></div>
                <span className="text-xs font-semibold hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0)}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            )}
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={messageToDelete !== null}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
      <ConfirmModal
        isOpen={chatToDelete !== null}
        onClose={() => setChatToDelete(null)}
        onConfirm={() => chatToDelete && deleteChat(chatToDelete)}
        title="Delete Chat Session"
        message="Are you sure you want to delete this entire chat session? This action cannot be undone."
        confirmText="Delete Chat"
        isDestructive={true}
      />
    </div>
  );
}
