import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Task, ChatMessage, Settings, Mood, StudyRecord, ChatSession, TaskPriority, JournalEntry } from '@/types';
import { auth, db } from '@/config/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/utils/firestoreErrorHandler';
import { set as idbSet } from 'idb-keyval';

type TimerMode = 'focus' | 'break';

export const AMBIENT_SOUNDS = [
  { id: 'none', label: 'No Sound', url: '' },
  { id: 'rain', label: 'Rain', url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Heavy_Rain_in_Summer.ogg' },
  { id: 'cafe', label: 'Cafe', url: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Cafe_ambiance.ogg' },
  { id: 'white_noise', label: 'White Noise', url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/White_noise.ogg' },
  { id: 'airport', label: 'Airport', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/2023-05-30_Flughafen-Porto_Gepaeckaberfertigungshalle_Sicherheitskontrolle.ogg' },
  { id: 'forest', label: 'Forest', url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/404114_felix-blume_toucans-singing-in-the-amazonian-rainforest-brazil.ogg' },
  { id: 'lofi', label: 'Lo-fi', url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Sappheiros_-_Perspective_%28Lofi_Hip_Hop%29.ogg' },
  { id: 'campfire', label: 'Campfire', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Campfire_sound_ambience.ogg' }
];

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  
  createChatSession: () => void;
  updateChatTitle: (id: string, title: string) => void;
  deleteChatSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  setSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;
  
  setActiveChatId: (id: string | null) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  incrementSessions: (minutes: number) => void;
  setMood: (mood: Mood | null) => void;
  mood: Mood | null;
  
  timerMode: TimerMode;
  timerTimeLeft: number;
  timerIsRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  
  activeSoundId: string;
  setActiveSoundId: (id: string) => void;
  isAlarmRinging: boolean;
  stopAlarm: () => void;
  
  setAiSchedule: (schedule: string | null) => void;
  
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;
}

const defaultSettings: Settings = {
  focusDuration: 25,
  breakDuration: 5,
  soundEnabled: true,
  theme: 'light',
};

let audioCtx: AudioContext | null = null;
export function playBeep(soundEnabled: boolean) {
  if (!soundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const baseFreq = 523.25;
  const playTone = (freq: number, startTime: number, duration: number) => {
    const osc = audioCtx!.createOscillator();
    const gainNode = audioCtx!.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx!.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = audioCtx.currentTime;
  playTone(baseFreq, now, 0.8);
  playTone(baseFreq * 1.5, now + 0.2, 1.2);
}

let alarmInterval: number | null = null;

function startAlarmSound(soundEnabled: boolean) {
  if (!soundEnabled) return;
  playBeep(true);
  alarmInterval = window.setInterval(() => {
    playBeep(true);
  }, 2000);
}

function stopAlarmSound() {
  if (alarmInterval !== null) {
    window.clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [focusStats, setFocusStats] = useState({ sessionsCompleted: 0, totalFocusMinutes: 0 });
  const [mood, setMoodState] = useState<Mood | null>(null);
  const [studyHistory, setStudyHistory] = useState<StudyRecord[]>([]);
  const [aiSchedule, setAiScheduleState] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [userDocInitialized, setUserDocInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const uid = user.uid;
        
        // Listen to user doc
        const unsubUser = onSnapshot(doc(db, 'users', uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
            if (data.focusStats) setFocusStats(data.focusStats);
            setMoodState(data.mood || null);
            if (data.aiSchedule !== undefined) setAiScheduleState(data.aiSchedule);
            setUserDocInitialized(true);
          } else {
              // Init user doc
            setDoc(doc(db, 'users', uid), { settings: defaultSettings, focusStats: { sessionsCompleted: 0, totalFocusMinutes: 0 }, streak: 0, mood: null, aiSchedule: null })
              .then(() => setUserDocInitialized(true))
              .catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${uid}`));
          }
        }, e => handleFirestoreError(e, OperationType.GET, `users/${uid}`));

        // Listen to tasks
        const unsubTasks = onSnapshot(collection(db, `users/${uid}/tasks`), (snapshot) => {
          setTasks(snapshot.docs.map(doc => doc.data() as Task).sort((a,b) => b.createdAt - a.createdAt));
        }, e => handleFirestoreError(e, OperationType.LIST, `users/${uid}/tasks`));

        // Listen to chat sessions
        const unsubChats = onSnapshot(collection(db, `users/${uid}/chatSessions`), (snapshot) => {
          const sessions = snapshot.docs.map(doc => doc.data() as ChatSession).sort((a,b) => b.updatedAt - a.updatedAt);
          setChatSessions(sessions);
          if (sessions.length > 0 && !activeChatId) {
            setActiveChatIdState(sessions[0].id);
          } else if (sessions.length === 0) {
            // Auto create first chat session
            const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            const session: ChatSession = {
              id: newId, title: 'Study Session', 
              messages: [{ id: newId, role: 'assistant', content: "Hi there! I'm your Zenova AI Mentor. How can I help you?", timestamp: Date.now() }],
              updatedAt: Date.now(), createdAt: Date.now()
            };
            setDoc(doc(db, `users/${uid}/chatSessions`, newId), session)
              .catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${uid}/chatSessions/${newId}`));
          }
        }, e => handleFirestoreError(e, OperationType.LIST, `users/${uid}/chatSessions`));

        // Listen to study history
        const unsubHistory = onSnapshot(collection(db, `users/${uid}/studyHistory`), (snapshot) => {
          setStudyHistory(snapshot.docs.map(doc => doc.data() as StudyRecord));
        }, e => handleFirestoreError(e, OperationType.LIST, `users/${uid}/studyHistory`));

        // Listen to journal entries
        const unsubJournal = onSnapshot(collection(db, `users/${uid}/journalEntries`), (snapshot) => {
          setJournalEntries(snapshot.docs.map(doc => doc.data() as JournalEntry).sort((a,b) => b.createdAt - a.createdAt));
        }, e => handleFirestoreError(e, OperationType.LIST, `users/${uid}/journalEntries`));

        return () => { unsubUser(); unsubTasks(); unsubChats(); unsubHistory(); unsubJournal(); };
      } else {
        setTasks([]); setChatSessions([]); setStudyHistory([]); setJournalEntries([]);
      }
    });
    return unsubscribe;
  }, []);

  // One-time migration to replace 'StudySync' and 'NeuroNest' with 'Zenova' in older database messages
  useEffect(() => {
    if (!auth.currentUser || chatSessions.length === 0) return;
    const uid = auth.currentUser.uid;
    chatSessions.forEach(session => {
      let needsUpdate = false;
      const newMessages = session.messages.map(m => {
        if (m.role === 'assistant' && (m.content.includes('StudySync') || m.content.includes('NeuroNest'))) {
          needsUpdate = true;
          return { ...m, content: m.content.replace(/StudySync/g, 'Zenova').replace(/NeuroNest/g, 'Zenova') };
        }
        return m;
      });

      if (needsUpdate) {
        updateDoc(doc(db, `users/${uid}/chatSessions`, session.id), { messages: newMessages })
          .catch(e => console.error("Failed to migrate chat session name", e));
      }
    });
  }, [chatSessions]);

  const streak = React.useMemo(() => {
    if (!studyHistory.length) return 0;
    const localDateStr = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    const todayStr = localDateStr(new Date());
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = localDateStr(yesterday);
    
    const sorted = [...studyHistory].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted[0].date !== todayStr && sorted[0].date !== yesterdayStr) return 0;
    
    let currentStreak = 0;
    let expectedDate = new Date(sorted[0].date + 'T12:00:00');
    
    for (const record of sorted) {
      if (record.date === localDateStr(expectedDate)) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else break;
    }
    return currentStreak;
  }, [studyHistory]);

  const sanitizeAttachments = async (attachments?: any[]) => {
    if (!attachments) return attachments;
    const sanitized = [];
    for (const att of attachments) {
      if (att.data && att.data.length > 500 * 1024) { // over 500KB
        try {
          await idbSet(att.idbId, att.data);
          const safeAtt = { ...att };
          delete safeAtt.data;
          sanitized.push(safeAtt);
        } catch (e) {
          console.error("Failed to save large attachment locally", e);
          sanitized.push(att); // fallback, will probably break Firestore
        }
      } else {
        sanitized.push(att);
      }
    }
    return sanitized;
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const task: any = { id, completed: false, createdAt: Date.now(), ...taskData };
    
    if (task.attachments) {
      task.attachments = await sanitizeAttachments(task.attachments);
    }

    // Remove undefined values
    Object.keys(task).forEach(key => {
      if (task[key] === undefined) {
        delete task[key];
      }
    });

    try { await setDoc(doc(db, `users/${uid}/tasks`, id), task); } 
    catch(e) { handleFirestoreError(e, OperationType.CREATE, `users/${uid}/tasks/${id}`); }
  };
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    
    const safeUpdates: any = { ...updates };
    if (safeUpdates.attachments) {
      safeUpdates.attachments = await sanitizeAttachments(safeUpdates.attachments);
    }

    // Remove undefined values
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key] === undefined) {
        delete safeUpdates[key];
      }
    });

    try { await updateDoc(doc(db, `users/${uid}/tasks`, id), safeUpdates); } 
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/tasks/${id}`); }
  };
  const removeTask = async (id: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await deleteDoc(doc(db, `users/${uid}/tasks`, id)); } 
    catch(e) { handleFirestoreError(e, OperationType.DELETE, `users/${uid}/tasks/${id}`); }
  };

  const createChatSession = async () => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const ts = Date.now();
    const session: ChatSession = {
      id, title: 'New Chat', messages: [{ id, role: 'assistant', content: "Hi there! What would you like to study?", timestamp: ts }],
      updatedAt: ts, createdAt: ts
    };
    try { 
      await setDoc(doc(db, `users/${uid}/chatSessions`, id), session);
      setActiveChatIdState(id);
    } catch(e) { handleFirestoreError(e, OperationType.CREATE, `users/${uid}/chatSessions/${id}`); }
  };
  const updateChatTitle = async (id: string, title: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await updateDoc(doc(db, `users/${uid}/chatSessions`, id), { title, updatedAt: Date.now() }); } 
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/chatSessions/${id}`); }
  };
  const deleteChatSession = async (id: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { 
      await deleteDoc(doc(db, `users/${uid}/chatSessions`, id));
      if (activeChatId === id) setActiveChatIdState(null);
    } catch(e) { handleFirestoreError(e, OperationType.DELETE, `users/${uid}/chatSessions/${id}`); }
  };
  const addMessage = async (sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try {
      const sessionRef = doc(db, `users/${uid}/chatSessions`, sessionId);
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) return;
      
      const sessionData = snap.data() as ChatSession;
      const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const ts = Date.now();
      
      const safeMessageData = { ...messageData };
      if (safeMessageData.attachments) {
        safeMessageData.attachments = await sanitizeAttachments(safeMessageData.attachments);
      }
      
      const newMessages = [...(sessionData.messages || []), { id, timestamp: ts, ...safeMessageData }];
      
      await updateDoc(sessionRef, { messages: newMessages, updatedAt: ts });
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/chatSessions/${sessionId}`); }
  };
  const updateMessage = async (sessionId: string, messageId: string, content: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try {
      const sessionRef = doc(db, `users/${uid}/chatSessions`, sessionId);
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) return;
      
      const sessionData = snap.data() as ChatSession;
      const newMessages = (sessionData.messages || []).map(m => m.id === messageId ? { ...m, content } : m);
      
      await updateDoc(sessionRef, { messages: newMessages, updatedAt: Date.now() });
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/chatSessions/${sessionId}`); }
  };
  const removeMessage = async (sessionId: string, messageId: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try {
      const sessionRef = doc(db, `users/${uid}/chatSessions`, sessionId);
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) return;
      
      const sessionData = snap.data() as ChatSession;
      const newMessages = (sessionData.messages || []).filter(m => m.id !== messageId);
      
      await updateDoc(sessionRef, { messages: newMessages, updatedAt: Date.now() });
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/chatSessions/${sessionId}`); }
  };
  const setSessionMessages = async (sessionId: string, newMessages: ChatMessage[]) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await updateDoc(doc(db, `users/${uid}/chatSessions`, sessionId), { messages: newMessages, updatedAt: Date.now() }); }
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/chatSessions/${sessionId}`); }
  };

  const setActiveChatId = (id: string | null) => setActiveChatIdState(id);
  
  const updateSettings = async (newSettings: Partial<Settings>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    const isDurationChanged = 
      (newSettings.focusDuration !== undefined && newSettings.focusDuration !== settings.focusDuration) ||
      (newSettings.breakDuration !== undefined && newSettings.breakDuration !== settings.breakDuration);

    const updated = { ...settings, ...newSettings };
    try { 
      await updateDoc(doc(db, `users/${uid}`), { settings: updated }); 
      setSettings(updated);
      
      if (isDurationChanged) {
        setTimerIsRunning(false);
        setTimerTimeLeft(timerMode === 'focus' ? updated.focusDuration * 60 : updated.breakDuration * 60);
      }
    } catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
  };

  const incrementSessions = async (minutes: number) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];
    
    // Update user stats
    const newStats = { sessionsCompleted: focusStats.sessionsCompleted + 1, totalFocusMinutes: focusStats.totalFocusMinutes + minutes };
    try { await updateDoc(doc(db, `users/${uid}`), { focusStats: newStats }); } 
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
    
    // Update study record
    const record = studyHistory.find(r => r.date === todayStr);
    try {
      if (record) {
        await updateDoc(doc(db, `users/${uid}/studyHistory`, todayStr), { minutes: record.minutes + minutes });
      } else {
        await setDoc(doc(db, `users/${uid}/studyHistory`, todayStr), { date: todayStr, minutes });
      }
    } catch(e) { handleFirestoreError(e, OperationType.WRITE, `users/${uid}/studyHistory/${todayStr}`); }
  };

  const setMood = async (newMood: Mood | null) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await updateDoc(doc(db, `users/${uid}`), { mood: newMood }); } 
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
  };

  const setAiSchedule = async (schedule: string | null) => {
    const uid = auth.currentUser?.uid; if(!uid) { setAiScheduleState(schedule); return; }
    try { await updateDoc(doc(db, `users/${uid}`), { aiSchedule: schedule }); }
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
  };

  const addJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const ts = Date.now();
    const entry: JournalEntry = { id, createdAt: ts, updatedAt: ts, ...entryData };
    try { await setDoc(doc(db, `users/${uid}/journalEntries`, id), entry); } 
    catch(e) { handleFirestoreError(e, OperationType.CREATE, `users/${uid}/journalEntries/${id}`); }
  };
  const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await updateDoc(doc(db, `users/${uid}/journalEntries`, id), { ...updates, updatedAt: Date.now() }); } 
    catch(e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}/journalEntries/${id}`); }
  };
  const removeJournalEntry = async (id: string) => {
    const uid = auth.currentUser?.uid; if(!uid) return;
    try { await deleteDoc(doc(db, `users/${uid}/journalEntries`, id)); } 
    catch(e) { handleFirestoreError(e, OperationType.DELETE, `users/${uid}/journalEntries/${id}`); }
  };

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timerTimeLeft, setTimerTimeLeft] = useState(() => defaultSettings.focusDuration * 60);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [activeSoundId, setActiveSoundId] = useState<string>('none');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerIsRunning && timerTimeLeft > 0) {
      interval = setInterval(() => setTimerTimeLeft(prev => prev - 1), 1000);
    } else if (timerIsRunning && timerTimeLeft === 0) {
      setTimerIsRunning(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerIsRunning, timerTimeLeft, auth.currentUser]); // added auth to avoid infinite loops if things change?

  useEffect(() => {
    if (userDocInitialized && !timerIsRunning) {
      setTimerTimeLeft(timerMode === 'focus' ? settings.focusDuration * 60 : settings.breakDuration * 60);
    }
  }, [userDocInitialized]); // sync on initial load

  const handleTimerComplete = () => {
    startAlarmSound(settings.soundEnabled);
    setIsAlarmRinging(true);
    if (timerMode === 'focus') {
      incrementSessions(settings.focusDuration);
      setTimerMode('break');
      setTimerTimeLeft(settings.breakDuration * 60);
    } else {
      setTimerMode('focus');
      setTimerTimeLeft(settings.focusDuration * 60);
    }
  };

  const toggleTimer = () => {
    if (isAlarmRinging) {
      stopAlarm();
    }
    setTimerIsRunning(!timerIsRunning);
  };
  const resetTimer = () => {
    if (isAlarmRinging) {
      stopAlarm();
    }
    setTimerIsRunning(false);
    setTimerTimeLeft(timerMode === 'focus' ? settings.focusDuration * 60 : settings.breakDuration * 60);
  };
  const skipBreak = () => {
    if (isAlarmRinging) {
      stopAlarm();
    }
    setTimerIsRunning(false);
    setTimerMode('focus');
    setTimerTimeLeft(settings.focusDuration * 60);
  };
  const stopAlarm = () => {
    setIsAlarmRinging(false);
    stopAlarmSound();
  };

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme]);

  // Audio rendering logic globally
  const activeSoundUrl = AMBIENT_SOUNDS.find(s => s.id === activeSoundId)?.url || '';
  const isPlayingSound = timerIsRunning && timerMode === 'focus' && activeSoundId !== 'none';

  return (
    <AppContext.Provider value={{
      tasks, addTask, updateTask, removeTask,
      chatSessions, createChatSession, updateChatTitle, deleteChatSession,
      addMessage, updateMessage, removeMessage, setSessionMessages,
      activeChatId, setActiveChatId,
      settings, updateSettings,
      focusStats, incrementSessions,
      streak, studyHistory,
      mood, setMood,
      aiSchedule, setAiSchedule,
      journalEntries, addJournalEntry, updateJournalEntry, removeJournalEntry,
      timerMode, timerTimeLeft, timerIsRunning, toggleTimer, resetTimer, skipBreak,
      activeSoundId, setActiveSoundId, isAlarmRinging, stopAlarm
    }}>
      {children}
      {AMBIENT_SOUNDS.map(sound => {
        if (!sound.url || sound.id === 'none') return null;
        const isActive = activeSoundId === sound.id;
        const isPlaying = isPlayingSound && isActive;
        
        return <AudioElement key={sound.id} sound={sound} isPlaying={isPlaying} />;
      })}
    </AppContext.Provider>
  );
};

function AudioElement({ sound, isPlaying }: { sound: { id: string; url: string }, isPlaying: boolean }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const playPromiseRef = React.useRef<Promise<void> | null>(null);

  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    
    el.volume = 0.4;
    
    if (isPlaying) {
      const p = el.play();
      if (p !== undefined) {
        playPromiseRef.current = p;
        p.catch(() => {});
      }
    } else {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          if (audioRef.current && !isPlaying) audioRef.current.pause();
        }).catch(() => {
          if (audioRef.current && !isPlaying) audioRef.current.pause();
        });
        playPromiseRef.current = null;
      } else {
        el.pause();
      }
    }
  }, [isPlaying]);

  return (
    <audio 
      ref={audioRef}
      src={sound.url}
      loop
      preload="auto"
      className="hidden"
    />
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

