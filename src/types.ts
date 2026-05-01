export type TaskPriority = 'urgent' | 'important' | 'optional';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  name: string;
  mimeType: string;
  data?: string; // Optional because large files might be stored in IndexedDB only
  idbId?: string;
  size?: number;
}

export interface Task {
  id: string;
  title: string;
  date?: string; // YYYY-MM-DD
  deadline?: string;
  subject?: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number;
  description?: string;
  subTasks?: SubTask[];
  attachments?: TaskAttachment[];
}

export type Mood = 'great' | 'okay' | 'stressed' | 'overwhelmed' | 'exhausted';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: TaskAttachment[];
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: Mood | null;
  font?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  createdAt: number;
}

export interface Settings {
  focusDuration: number;
  breakDuration: number;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface StudyRecord {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface AppState {
  tasks: Task[];
  chatSessions: ChatSession[];
  journalEntries: JournalEntry[];
  activeChatId: string | null;
  settings: Settings;
  focusStats: {
    sessionsCompleted: number;
    totalFocusMinutes: number;
  };
  streak: number;
  mood?: Mood | null;
  studyHistory: StudyRecord[];
  aiSchedule?: string | null;
}
