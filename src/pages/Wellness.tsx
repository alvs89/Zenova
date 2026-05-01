import React, { useState, useEffect } from 'react';
import { Heart, Wind, Smile, Meh, Frown, PenTool, Coffee, Moon, Book, Plus, Trash2, Calendar, ChevronLeft, Save, AlertCircle, X, Sun, Droplets, Activity, EyeOff, Music, User, RefreshCw } from 'lucide-react';
import { Mood, JournalEntry } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/context/AppContext';

const breathingSteps = ['Inhale...', 'Hold...', 'Exhale...'];

const MOOD_MESSAGES = {
  great: [
    "Awesome! Keep that momentum going, but don't forget to take breaks.",
    "Love to hear it! Channel that positive energy into your next task.",
    "You're crushing it today! Take a moment to celebrate how good you feel.",
    "That's fantastic! Keep riding that wave of productivity.",
    "Amazing! Remember this feeling, you've earned it."
  ],
  okay: [
    "That's okay. Some days are just average. Be kind to yourself today.",
    "Neutral is a good place to be. Steady and balanced.",
    "Just a normal day, and that's perfectly fine. Keep moving forward.",
    "Don't push too hard today. Consistency matters more than intensity right now.",
    "It's a marathon, not a sprint. Take it one step at a time."
  ],
  stressed: [
    "It's tough right now. Remember to prioritize the urgent things and let go of perfection. Try a breathing exercise.",
    "I hear you. Take a deep breath. Focus on just the very next step, nothing else.",
    "Burnout is real. It's okay to step away for 10 minutes and reset your mind.",
    "You carry a heavy load, but you don't have to carry it all at once. Break it down.",
    "This feeling will pass. Drink some water, stretch, and be gentle with yourself."
  ]
};

const BURNOUT_TIPS = [
  { icon: Moon, iconColor: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'Protect your sleep. Cramming all night reduces memory retention anyway.' },
  { icon: PenTool, iconColor: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-500/10', text: 'Do a "brain dump". Write down everything worrying you to free up cognitive load.' },
  { icon: Sun, iconColor: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10', text: 'Step outside for 5 minutes. Sunlight helps reset your circadian rhythm.' },
  { icon: Droplets, iconColor: 'text-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-500/10', text: 'Hydrate! Even mild dehydration can impair cognitive function and concentration.' },
  { icon: Activity, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'Get moving. A quick 10-minute walk can significantly boost your focus.' },
  { icon: Coffee, iconColor: 'text-amber-700 dark:text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-500/10', text: 'Limit caffeine late in the day to ensure you get restorative sleep tonight.' },
  { icon: EyeOff, iconColor: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-500/10', text: 'Follow the 20-20-20 rule to reduce eye strain: Every 20 mins, look 20 ft away for 20 secs.' },
  { icon: Music, iconColor: 'text-fuchsia-500', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', text: 'Listen to a song you love without trying to "do" anything else at the same time.' },
  { icon: User, iconColor: 'text-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-500/10', text: 'Talk to a friend about something entirely unrelated to your studies or work.' },
];

const FONT_OPTIONS = [
  { value: 'font-sans', label: 'Default' },
  { value: 'font-caveat', label: 'Handwriting' },
  { value: 'font-playfair', label: 'Elegant' },
  { value: 'font-lora', label: 'Storybook' },
  { value: 'font-nunito', label: 'Rounded' },
  { value: 'font-merriweather', label: 'Classic Book' },
  { value: 'font-quicksand', label: 'Friendly' },
  { value: 'font-space-mono', label: 'Typewriter' },
];

export function Wellness() {
  const { mood, setMood, journalEntries, addJournalEntry, updateJournalEntry, removeJournalEntry } = useAppContext();
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathStep, setBreathStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTips, setActiveTips] = useState<typeof BURNOUT_TIPS>([]);
  
  // Journal state
  const [isWriting, setIsWriting] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftFont, setDraftFont] = useState('font-sans');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);

  const refreshTips = () => {
    const shuffled = [...BURNOUT_TIPS].sort(() => 0.5 - Math.random());
    setActiveTips(shuffled.slice(0, 2));
  };

  useEffect(() => {
    refreshTips();
  }, []);

  useEffect(() => {
    if (mood) {
      const messages = MOOD_MESSAGES[mood];
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [mood]);

  const startBreathing = () => {
    setIsBreathing(true);
    let step = 0;
    
    // Simple breathing simulation
    const interval = setInterval(() => {
      step = (step + 1) % 3;
      setBreathStep(step);
    }, 4000);

    setTimeout(() => {
      clearInterval(interval);
      setIsBreathing(false);
      setBreathStep(0);
    }, 4000 * 3 * 2); // 2 full cycles
  };
  
  const handleSaveJournal = () => {
    if (!draftContent.trim()) return;
    
    const entryData: Partial<JournalEntry> = {
      title: draftTitle,
      content: draftContent,
      font: draftFont,
    };
    if (mood) entryData.mood = mood;

    if (editingId) {
      updateJournalEntry(editingId, entryData);
    } else {
      addJournalEntry(entryData as Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    setIsWriting(false);
    setDraftTitle('');
    setDraftContent('');
    setDraftFont('font-sans');
    setEditingId(null);
  };
  
  const handleEditJournal = (entry: JournalEntry) => {
    setDraftTitle(entry.title || '');
    setDraftContent(entry.content);
    setDraftFont(entry.font || 'font-sans');
    setEditingId(entry.id);
    setIsWriting(true);
  };

  const handleCancelWrite = () => {
    setIsWriting(false);
    setDraftTitle('');
    setDraftContent('');
    setDraftFont('font-sans');
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-10 pb-6 md:pb-10 max-w-5xl mx-auto space-y-8 md:space-y-12 min-h-[calc(100vh-80px)]">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Heart className="text-rose-500" size={32} />
          Wellness & Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Check in with yourself. Grades matter, but your mental health matters more.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col: Mood Check-in */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 font-medium">How are you feeling right now?</h2>
          
          <div className="flex justify-center gap-4 w-full px-4 mb-8">
            {([
              { m: 'great', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-100' },
              { m: 'okay', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-100' },
              { m: 'stressed', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-100' },
            ] as {m: Mood, icon: any, color: string, bg: string}[]).map(({m, icon: Icon, color, bg}) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={cn(
                  "flex-1 flex flex-col items-center p-4 rounded-2xl transition-all border-2",
                  mood === m 
                    ? `border-${color.split('-')[1]}-500 ${bg} shadow-sm dark:bg-black/20`
                    : "border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon size={36} className={cn("mb-2", color)} />
                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{m}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mood && (
               <motion.div
                key={mood + currentMessage} // animate when message changes
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-5 rounded-2xl w-full text-left font-medium",
                  mood === 'great' && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300",
                  mood === 'okay' && "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300",
                  mood === 'stressed' && "bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300"
                )}
               >
                 {currentMessage}
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: Breathing / Quick Tips */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-8 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Wind size={100} />
            </div>
            
            <div className="relative z-10 w-full">
              <h3 className="font-bold text-2xl mb-2">1-Minute Reset</h3>
              <p className="text-teal-50 mb-6">Lower cortisol levels with box breathing.</p>
              
              {!isBreathing ? (
                <button 
                  onClick={startBreathing}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition-colors border border-white/30 shadow-sm"
                >
                  Start Breathing
                </button>
              ) : (
                <div className="h-[48px] flex items-center">
                  <motion.div
                    key={breathStep}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { duration: 2 } }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="text-3xl font-bold tracking-wider"
                  >
                    {breathingSteps[breathStep]}
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                <Coffee size={20} className="text-amber-600 dark:text-amber-500" /> Quick Tips vs Burnout
              </h3>
              <button 
                onClick={refreshTips}
                className="p-2 -mr-2 bg-white/50 dark:bg-amber-900/20 hover:bg-white dark:hover:bg-amber-900/40 rounded-full text-amber-600/70 hover:text-amber-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 active:scale-95"
                title="Refresh tips"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="space-y-3 relative">
              <AnimatePresence mode="popLayout">
                {activeTips.map((tip, i) => {
                  const TipIcon = tip.icon;
                  return (
                    <motion.div
                      key={tip.text}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-start gap-4 bg-white dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50"
                    >
                      <div className={cn("mt-0.5 shrink-0 p-2.5 rounded-xl", tip.bgColor)}>
                        <TipIcon size={18} className={tip.iconColor} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{tip.text}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      {/* Journal Section */}
      <div className="bg-[#fcfaf8] dark:bg-slate-900/80 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Book size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Personal Journal</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">A safe space to reflect, untangle thoughts, and just be.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isWriting && (
              <button 
                onClick={() => setIsWriting(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={18} />
                New Entry
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isWriting ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={handleCancelWrite}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back to entries
                </button>
                <select 
                  value={draftFont}
                  onChange={(e) => setDraftFont(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-xl px-4 py-2 text-slate-700 dark:text-slate-300 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                >
                  {FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              
              <div className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-slate-200/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all focus-within:shadow-[0_8px_30px_rgb(79,70,229,0.1)] focus-within:border-indigo-300/50 dark:focus-within:border-indigo-700/50 overflow-hidden">
                {/* Decorative blurred blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-3/4 h-3/4 bg-indigo-100/50 dark:bg-indigo-900/20 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 group-focus-within:bg-indigo-200/50 dark:group-focus-within:bg-indigo-800/30" />
                <div className="absolute bottom-[-20%] left-[-10%] w-3/4 h-3/4 bg-rose-100/50 dark:bg-rose-900/20 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 group-focus-within:bg-rose-200/50 dark:group-focus-within:bg-rose-800/30" />

                <div className="relative z-10">
                  <input
                    type="text"
                    placeholder="Give your entry a title..."
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className={cn(
                      "w-full bg-transparent border-none text-3xl font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400/70 dark:placeholder:text-slate-600 focus:outline-none focus:ring-0 pb-4 mb-2 border-b-2 border-dashed border-slate-200 dark:border-slate-700/50 transition-colors focus:border-indigo-300 dark:focus:border-indigo-600/50",
                      draftFont
                    )}
                  />
                  <div className="relative mt-4">
                    <textarea
                      placeholder="How are you feeling today? Let your thoughts flow..."
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-none p-0 m-0 text-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400/70 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 min-h-[45vh] resize-none block",
                        draftFont
                      )}
                      style={{
                        padding: '0',
                        margin: '0',
                        lineHeight: '2.5rem',
                        backgroundSize: '100% 2.5rem',
                        backgroundImage: 'linear-gradient(transparent calc(2.5rem - 1px), rgba(165, 180, 252, 0.4) calc(2.5rem - 1px), rgba(165, 180, 252, 0.4) 100%)',
                        backgroundAttachment: 'local',
                      }}
                    />
                  </div>
                </div>
                <div className="pt-6 mt-4 flex justify-end relative z-10">
                  <button
                    onClick={handleSaveJournal}
                    disabled={!draftContent.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-md"
                  >
                    <Save size={18} />
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {journalEntries.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Book size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Your Journal is Empty</h3>
                  <p className="text-slate-500 dark:text-slate-400">Take a deep breath and start your first entry.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(showAllEntries ? journalEntries : journalEntries.slice(0, 4)).map(entry => {
                       const date = new Date(entry.createdAt);
                       return (
                         <div 
                           key={entry.id} 
                           className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                           onClick={() => handleEditJournal(entry)}
                         >
                           {entry.mood && (
                             <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 rounded-bl-3xl opacity-50" />
                           )}
                           <div className="flex items-center justify-between mb-3 relative z-10">
                             <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                               <Calendar size={14} />
                               {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry.id); }}
                               className="text-slate-300 hover:text-rose-500 transition-colors bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                           <h3 className={cn("font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 relative z-10", entry.font || "font-sans")}>
                             {entry.title || "Untitled Entry"}
                           </h3>
                           <p className={cn("text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed relative z-10 w-11/12", entry.font || "font-sans")}>{entry.content}</p>
                         </div>
                       );
                    })}
                  </div>
                  {journalEntries.length > 4 && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => setShowAllEntries(!showAllEntries)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm transition-colors py-2 px-6 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-full"
                      >
                        {showAllEntries ? `Show Less` : `See All ${journalEntries.length} Entries`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {entryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100 dark:border-slate-700 relative"
            >
              <div className="flex flex-col items-center text-center mt-2">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full text-rose-500 mb-4">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Entry?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Are you sure you want to delete this journal entry? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setEntryToDelete(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 hover:dark:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (entryToDelete) {
                        removeJournalEntry(entryToDelete);
                        setEntryToDelete(null);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
