import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Clock, User as UserIcon, Camera, HelpCircle, ChevronDown, ChevronUp, Key } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "How does the Study Patterns bar graph operate?",
    answer: "The Study Patterns bar graph, located on your Dashboard, visualizes your total focus hours over the last 7 days. \"Focus hours\" represent the cumulative amount of time you have spent actively running the Pomodoro Timer in \"Focus Session\" mode. At the end of every Focus Session, the time spent is automatically logged and aggregated by day. This helps you identify trends in your productivity and optimize your weekly study schedule."
  },
  {
    question: "How do I manage my daily tasks and priorities?",
    answer: "Using the built-in Planner, you can add tasks, set their priority (Urgent, Important, Normal, or Optional), and assign them to specific dates. Tasks marked as Urgent will prominently display on your Dashboard."
  },
  {
    question: "How does the Pomodoro Timer work?",
    answer: "The Pomodoro Timer allows you to run structured Focus Sessions and Quick Breaks. You can customize the duration of both within this Settings menu. During a Focus Session, you can enable ambient audio to minimize distractions. When the session concludes, an alarm will ring continuously until manually stopped."
  },
  {
    question: "What capabilities does the AI Assistant offer?",
    answer: "The AI Assistant is designed to enhance your workflow by generating intelligent study schedules and breaking down complex tasks into actionable subtasks. You can also chat directly with the AI to summarize content or clarify study material."
  },
  {
    question: "How does the Wellness & Journaling system benefit my productivity?",
    answer: "Tracking your mood and writing journal entries allows you to reflect on your physical and mental well-being over time. A holistic view ensures you avoid burnout and maintain a healthy balance while studying."
  }
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
        <HelpCircle size={18} className="text-indigo-500" />
        Frequently Asked Questions
      </h3>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 transition-all focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 focus-within:border-transparent"
          >
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-4 py-3 text-left flex justify-between items-center gap-3 bg-transparent outline-none"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp size={18} className="text-slate-500 flex-shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />
              )}
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useAppContext();
  const { user, updateUserProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [localFocusDuration, setLocalFocusDuration] = useState(settings.focusDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(settings.breakDuration);
  const [localApiKey, setLocalApiKey] = useState(localStorage.getItem('zenova_gemini_api_key') || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingTimers, setIsSavingTimers] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setDisplayName(user?.displayName || '');
      setPhotoURL(user?.photoURL || '');
      setLocalFocusDuration(settings.focusDuration);
      setLocalBreakDuration(settings.breakDuration);
      setLocalApiKey(localStorage.getItem('zenova_gemini_api_key') || '');
    }
  }, [isOpen, user, settings.focusDuration, settings.breakDuration]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateUserProfile(displayName, photoURL);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveTimers = async () => {
    setIsSavingTimers(true);
    try {
      await updateSettings({ focusDuration: localFocusDuration, breakDuration: localBreakDuration });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingTimers(false);
    }
  };

  const handleSaveKey = () => {
    setIsSavingKey(true);
    try {
      if (localApiKey.trim() === '') {
        localStorage.removeItem('zenova_gemini_api_key');
      } else {
        localStorage.setItem('zenova_gemini_api_key', localApiKey.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSavingKey(false), 500); // small delay to show feedback
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setPhotoURL(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-left border dark:border-slate-800"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <UserIcon size={18} className="text-indigo-500" />
                Profile
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img 
                      src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera size={20} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full box-border bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-800 dark:text-slate-200 text-base"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || (displayName === user?.displayName && photoURL === user?.photoURL)}
                  className="bg-indigo-600 self-end hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" />
                Timer Durations (minutes)
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">Focus</label>
                  <input 
                    type="number" 
                    min="1"
                    max="120"
                    value={localFocusDuration}
                    onChange={(e) => setLocalFocusDuration(Number(e.target.value) || 25)}
                    className="w-full box-border bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-800 dark:text-slate-200 text-base"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 truncate">Break</label>
                  <input 
                    type="number" 
                    min="1"
                    max="60"
                    value={localBreakDuration}
                    onChange={(e) => setLocalBreakDuration(Number(e.target.value) || 5)}
                    className="w-full box-border bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-800 dark:text-slate-200 text-base"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveTimers}
                disabled={isSavingTimers || (localFocusDuration === settings.focusDuration && localBreakDuration === settings.breakDuration)}
                className="bg-indigo-600 w-full hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors mt-2"
              >
                {isSavingTimers ? 'Saving...' : 'Save Timer Duration'}
              </button>
            </div>

            <div className="space-y-4 pt-2">
               <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 size={18} className="text-indigo-500" /> : <VolumeX size={18} className="text-slate-400" />}
                Audio
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Timer Sound Effects</span>
                <button 
                  onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none", settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700')}
                >
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", settings.soundEnabled ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
               <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-xl">☀️</span>
                Appearance
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Dark Mode</span>
                <button 
                  onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                  className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none", settings.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700')}
                >
                  <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
               <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Key size={18} className="text-indigo-500" />
                Gemini API Key
              </h3>
              
              <div className="flex flex-col gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  If you encounter quota errors, add your own free Gemini API key. It is saved locally in your browser.
                </p>
                <div className="min-w-0">
                  <input 
                    type="password"
                    placeholder="AIzaSy..." 
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="w-full box-border bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button 
                  onClick={handleSaveKey}
                  disabled={isSavingKey || localApiKey === (localStorage.getItem('zenova_gemini_api_key') || '')}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors mt-1"
                >
                  {isSavingKey ? 'Saved!' : 'Save API Key'}
                </button>
              </div>
            </div>

            <FAQSection />

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
