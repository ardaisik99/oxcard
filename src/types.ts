export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface WordItem {
  id: number;
  w: string;
  tr: string;
  def: string;
  ex: string;
  pos: string;
  lvl: CEFRLevel;
  syn?: string[];
  col?: string[];
}

export type WordStatus = 'new' | 'known' | 'learning' | 'learned';

export interface WordProgress {
  status: WordStatus;
  learnedAt?: string;       // YYYY-MM-DD
  knownAt?: string;         // YYYY-MM-DD
  reviewCount: number;
  intervalDays: number;
  nextReviewDate?: string;  // YYYY-MM-DD
  favorite?: boolean;
  mistakes?: number;
}

export type SessionPhase = 'triage' | 'ready' | 'study' | 'quiz' | 'completed';

export interface TriageAction {
  wordId: number;
  action: 'learn' | 'known';
}

export interface DailySession {
  date: string;                 // YYYY-MM-DD
  targetCount: number;          // e.g. 20
  phase: SessionPhase;
  selectedWordIds: number[];    // Words swiped as "Bilmiyorum" for today's study
  knownWordIds: number[];       // Words swiped as "Biliyorum" today
  studiedWordIds: number[];     // Words marked "Öğrendim" in flashcard step
  masteredWordIds: number[];    // Words passed in quiz / finalized today
  completedBatches: number;     // How many batches finished today (1 = daily goal done)
  completedAt?: string;
  triageHistory: TriageAction[];
}

export interface DayHistorySummary {
  date: string;
  learnedIds: number[];
  knownIds: number[];
  reviewedIds: number[];
  targetCount: number;
  completed: boolean;
}

export type LevelFilterPref = 'ALL' | CEFRLevel;

export interface UserSettings {
  userName: string;
  dailyGoal: number;
  startLevel: LevelFilterPref;
  accent: 'en-US' | 'en-GB';
  speechRate: number;
  autoSpeak: boolean;
  includeQuiz: boolean;
  onboardingCompleted: boolean;
}

export type AppTab = 'today' | 'dictionary' | 'stats' | 'settings';

export type ActiveOverlay =
  | { type: 'none' }
  | { type: 'triage' }
  | { type: 'study' }
  | { type: 'quiz' }
  | { type: 'review' };

export interface AppState {
  version: number;
  settings: UserSettings;
  wordProgress: Record<number, WordProgress>;
  sessions: Record<string, DailySession>;
  history: Record<string, DayHistorySummary>;
  simulatedDayOffset: number;
}
