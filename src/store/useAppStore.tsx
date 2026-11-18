import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { OXFORD_WORDS, WORD_BY_ID } from '../data/words';
import {
  addDaysToKey,
  computeStreak,
  getActiveDateKey,
} from '../utils/dates';
import type {
  ActiveOverlay,
  AppState,
  AppTab,
  CEFRLevel,
  DailySession,
  DayHistorySummary,
  UserSettings,
  WordItem,
  WordStatus,
} from '../types';

const STORAGE_KEY = 'oxcard_oxford3000_state_v1';

const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  dailyGoal: 20,
  startLevel: 'ALL',
  accent: 'en-US',
  speechRate: 0.95,
  autoSpeak: false,
  includeQuiz: true,
  onboardingCompleted: false,
};

const DEFAULT_STATE: AppState = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  wordProgress: {},
  sessions: {},
  history: {},
  simulatedDayOffset: 0,
};

function createEmptySession(date: string, targetCount: number): DailySession {
  return {
    date,
    targetCount,
    phase: 'triage',
    selectedWordIds: [],
    knownWordIds: [],
    studiedWordIds: [],
    masteredWordIds: [],
    completedBatches: 0,
    triageHistory: [],
  };
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      wordProgress: parsed.wordProgress || {},
      sessions: parsed.sessions || {},
      history: parsed.history || {},
      simulatedDayOffset: typeof parsed.simulatedDayOffset === 'number' ? parsed.simulatedDayOffset : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const NEXT_INTERVALS = [1, 3, 7, 14, 30, 60];

function getNextInterval(currentInterval: number): number {
  for (const step of NEXT_INTERVALS) {
    if (step > currentInterval) return step;
  }
  return 90;
}

const LEVEL_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];

interface AppStoreContextValue {
  state: AppState;
  todayKey: string;
  todaySession: DailySession;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  overlay: ActiveOverlay;
  setOverlay: (overlay: ActiveOverlay) => void;
  // Derived collections
  triageQueue: WordItem[];
  todaySelectedWords: WordItem[];
  dueReviewWords: WordItem[];
  streak: number;
  totals: {
    totalWords: number;
    learnedCount: number;
    knownCount: number;
    learningCount: number;
    favoriteCount: number;
    masteredOrKnownCount: number;
    byLevel: Record<CEFRLevel, { learned: number; known: number; total: number }>;
  };
  // Actions
  completeOnboarding: (opts: { dailyGoal: number; startLevel: UserSettings['startLevel']; userName: string }) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  triageLearn: (wordId: number) => void;
  triageKnown: (wordId: number) => void;
  undoTriage: () => void;
  startStudyFromReady: () => void;
  completeStudyPhase: (studiedIds: number[]) => void;
  completeQuizPhase: (masteredIds: number[], mistakeMap: Record<number, number>) => void;
  startExtraBatch: () => void;
  recordReviewResult: (wordId: number, remembered: boolean) => void;
  toggleFavorite: (wordId: number) => void;
  setWordStatusManual: (wordId: number, status: WordStatus) => void;
  addWordToTodaySelection: (wordId: number) => { added: boolean; message: string };
  removeWordFromTodaySelection: (wordId: number) => void;
  advanceSimulatedDay: (delta: number) => void;
  resetSimulatedDay: () => void;
  exportBackup: () => string;
  importBackup: (jsonString: string) => { ok: boolean; error?: string };
  resetAllData: () => void;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [overlay, setOverlay] = useState<ActiveOverlay>({ type: 'none' });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const todayKey = useMemo(
    () => getActiveDateKey(state.simulatedDayOffset),
    [state.simulatedDayOffset],
  );

  const todaySession = useMemo<DailySession>(() => {
    const existing = state.sessions[todayKey];
    if (existing) return existing;
    return createEmptySession(todayKey, state.settings.dailyGoal);
  }, [state.sessions, todayKey, state.settings.dailyGoal]);

  const triageQueue = useMemo<WordItem[]>(() => {
    const selectedSet = new Set(todaySession.selectedWordIds);
    const knownSet = new Set(todaySession.knownWordIds);

    const eligible = OXFORD_WORDS.filter((w) => {
      if (selectedSet.has(w.id) || knownSet.has(w.id)) return false;
      const prog = state.wordProgress[w.id];
      if (!prog) return true;
      return prog.status === 'new';
    });

    const pref = state.settings.startLevel;
    if (pref === 'ALL') return eligible;

    const minIdx = LEVEL_ORDER.indexOf(pref);
    const prioritized: WordItem[] = [];
    const rest: WordItem[] = [];
    for (const w of eligible) {
      if (LEVEL_ORDER.indexOf(w.lvl) >= minIdx) {
        prioritized.push(w);
      } else {
        rest.push(w);
      }
    }
    return [...prioritized, ...rest];
  }, [state.wordProgress, todaySession.selectedWordIds, todaySession.knownWordIds, state.settings.startLevel]);

  const todaySelectedWords = useMemo<WordItem[]>(() => {
    return todaySession.selectedWordIds
      .map((id) => WORD_BY_ID.get(id))
      .filter((w): w is WordItem => Boolean(w));
  }, [todaySession.selectedWordIds]);

  const dueReviewWords = useMemo<WordItem[]>(() => {
    const list: WordItem[] = [];
    for (const w of OXFORD_WORDS) {
      const p = state.wordProgress[w.id];
      if (p && p.status === 'learned' && p.nextReviewDate && p.nextReviewDate <= todayKey) {
        list.push(w);
      }
    }
    // Sort oldest due first
    list.sort((a, b) => {
      const da = state.wordProgress[a.id]?.nextReviewDate || '';
      const db = state.wordProgress[b.id]?.nextReviewDate || '';
      return da.localeCompare(db);
    });
    return list;
  }, [state.wordProgress, todayKey]);

  const streak = useMemo(() => {
    const completedDates = new Set<string>();
    for (const [date, summary] of Object.entries(state.history)) {
      if (summary.completed || summary.learnedIds.length > 0) {
        completedDates.add(date);
      }
    }
    return computeStreak(completedDates, todayKey);
  }, [state.history, todayKey]);

  const totals = useMemo(() => {
    let learnedCount = 0;
    let knownCount = 0;
    let learningCount = 0;
    let favoriteCount = 0;
    const byLevel: Record<CEFRLevel, { learned: number; known: number; total: number }> = {
      A1: { learned: 0, known: 0, total: 0 },
      A2: { learned: 0, known: 0, total: 0 },
      B1: { learned: 0, known: 0, total: 0 },
      B2: { learned: 0, known: 0, total: 0 },
    };

    for (const w of OXFORD_WORDS) {
      byLevel[w.lvl].total += 1;
      const p = state.wordProgress[w.id];
      if (!p) continue;
      if (p.favorite) favoriteCount += 1;
      if (p.status === 'learned') {
        learnedCount += 1;
        byLevel[w.lvl].learned += 1;
      } else if (p.status === 'known') {
        knownCount += 1;
        byLevel[w.lvl].known += 1;
      } else if (p.status === 'learning') {
        learningCount += 1;
      }
    }

    return {
      totalWords: OXFORD_WORDS.length,
      learnedCount,
      knownCount,
      learningCount,
      favoriteCount,
      masteredOrKnownCount: learnedCount + knownCount,
      byLevel,
    };
  }, [state.wordProgress]);

  const completeOnboarding = useCallback(
    (opts: { dailyGoal: number; startLevel: UserSettings['startLevel']; userName: string }) => {
      setState((prev) => {
        const key = getActiveDateKey(prev.simulatedDayOffset);
        const existingSession = prev.sessions[key];
        const nextSession = existingSession
          ? { ...existingSession, targetCount: opts.dailyGoal }
          : createEmptySession(key, opts.dailyGoal);
        return {
          ...prev,
          settings: {
            ...prev.settings,
            dailyGoal: opts.dailyGoal,
            startLevel: opts.startLevel,
            userName: opts.userName.trim(),
            onboardingCompleted: true,
          },
          sessions: {
            ...prev.sessions,
            [key]: nextSession,
          },
        };
      });
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setState((prev) => {
      const nextSettings = { ...prev.settings, ...patch };
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const current = prev.sessions[key];
      const nextSessions = { ...prev.sessions };

      if (patch.dailyGoal !== undefined && current && (current.phase === 'triage' || current.phase === 'ready')) {
        const nextPhase =
          current.selectedWordIds.length >= patch.dailyGoal ? 'ready' : 'triage';
        nextSessions[key] = {
          ...current,
          targetCount: patch.dailyGoal,
          phase: nextPhase,
        };
      }

      return {
        ...prev,
        settings: nextSettings,
        sessions: nextSessions,
      };
    });
  }, []);

  const triageLearn = useCallback((wordId: number) => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key] || createEmptySession(key, prev.settings.dailyGoal);
      if (cur.selectedWordIds.includes(wordId)) return prev;

      const selectedWordIds = [...cur.selectedWordIds, wordId];
      const targetReached = selectedWordIds.length >= cur.targetCount;
      const existingProg = prev.wordProgress[wordId];

      return {
        ...prev,
        wordProgress: {
          ...prev.wordProgress,
          [wordId]: {
            reviewCount: existingProg?.reviewCount || 0,
            intervalDays: existingProg?.intervalDays || 0,
            favorite: existingProg?.favorite || false,
            mistakes: existingProg?.mistakes || 0,
            status: 'learning',
          },
        },
        sessions: {
          ...prev.sessions,
          [key]: {
            ...cur,
            selectedWordIds,
            phase: targetReached ? 'ready' : 'triage',
            triageHistory: [...cur.triageHistory, { wordId, action: 'learn' }],
          },
        },
      };
    });
  }, []);

  const triageKnown = useCallback((wordId: number) => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key] || createEmptySession(key, prev.settings.dailyGoal);
      if (cur.knownWordIds.includes(wordId)) return prev;

      const existingProg = prev.wordProgress[wordId];
      const prevHist: DayHistorySummary = prev.history[key] || {
        date: key,
        learnedIds: [],
        knownIds: [],
        reviewedIds: [],
        targetCount: cur.targetCount,
        completed: false,
      };

      const nextKnownHist = prevHist.knownIds.includes(wordId)
        ? prevHist.knownIds
        : [...prevHist.knownIds, wordId];

      return {
        ...prev,
        wordProgress: {
          ...prev.wordProgress,
          [wordId]: {
            reviewCount: existingProg?.reviewCount || 0,
            intervalDays: existingProg?.intervalDays || 0,
            favorite: existingProg?.favorite || false,
            mistakes: existingProg?.mistakes || 0,
            status: 'known',
            knownAt: key,
          },
        },
        sessions: {
          ...prev.sessions,
          [key]: {
            ...cur,
            knownWordIds: [...cur.knownWordIds, wordId],
            triageHistory: [...cur.triageHistory, { wordId, action: 'known' }],
          },
        },
        history: {
          ...prev.history,
          [key]: {
            ...prevHist,
            knownIds: nextKnownHist,
          },
        },
      };
    });
  }, []);

  const undoTriage = useCallback(() => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key];
      if (!cur || cur.triageHistory.length === 0) return prev;

      const last = cur.triageHistory[cur.triageHistory.length - 1];
      const nextHistory = cur.triageHistory.slice(0, -1);
      const nextSelected =
        last.action === 'learn'
          ? cur.selectedWordIds.filter((id) => id !== last.wordId)
          : cur.selectedWordIds;
      const nextKnown =
        last.action === 'known'
          ? cur.knownWordIds.filter((id) => id !== last.wordId)
          : cur.knownWordIds;

      const nextWordProgress = { ...prev.wordProgress };
      const existingProg = nextWordProgress[last.wordId];
      if (existingProg?.favorite) {
        nextWordProgress[last.wordId] = { ...existingProg, status: 'new', knownAt: undefined };
      } else {
        delete nextWordProgress[last.wordId];
      }

      const prevDayHist = prev.history[key];
      const nextDayHistoryMap = { ...prev.history };
      if (prevDayHist && last.action === 'known') {
        nextDayHistoryMap[key] = {
          ...prevDayHist,
          knownIds: prevDayHist.knownIds.filter((id) => id !== last.wordId),
        };
      }

      return {
        ...prev,
        wordProgress: nextWordProgress,
        sessions: {
          ...prev.sessions,
          [key]: {
            ...cur,
            selectedWordIds: nextSelected,
            knownWordIds: nextKnown,
            triageHistory: nextHistory,
            phase: 'triage',
          },
        },
        history: nextDayHistoryMap,
      };
    });
  }, []);

  const startStudyFromReady = useCallback(() => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key];
      if (!cur || cur.selectedWordIds.length === 0) return prev;
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [key]: { ...cur, phase: 'study' },
        },
      };
    });
    setOverlay({ type: 'study' });
  }, []);

  const finalizeBatchHelper = (
    prev: AppState,
    key: string,
    masteredIds: number[],
    mistakeMap: Record<number, number> = {},
  ): AppState => {
    const cur = prev.sessions[key] || createEmptySession(key, prev.settings.dailyGoal);
    const wordIdsToSave = cur.selectedWordIds.length > 0 ? cur.selectedWordIds : masteredIds;
    const nextProgress = { ...prev.wordProgress };
    const nextReviewDate = addDaysToKey(key, 1);

    for (const id of wordIdsToSave) {
      const existing = nextProgress[id];
      const addedMistakes = mistakeMap[id] || 0;
      nextProgress[id] = {
        status: 'learned',
        learnedAt: key,
        reviewCount: (existing?.reviewCount || 0) + 1,
        intervalDays: 1,
        nextReviewDate,
        favorite: existing?.favorite || false,
        mistakes: (existing?.mistakes || 0) + addedMistakes,
      };
    }

    const prevHist: DayHistorySummary = prev.history[key] || {
      date: key,
      learnedIds: [],
      knownIds: [],
      reviewedIds: [],
      targetCount: cur.targetCount,
      completed: false,
    };

    const mergedLearned = Array.from(new Set([...prevHist.learnedIds, ...wordIdsToSave]));

    return {
      ...prev,
      wordProgress: nextProgress,
      sessions: {
        ...prev.sessions,
        [key]: {
          ...cur,
          studiedWordIds: wordIdsToSave,
          masteredWordIds: wordIdsToSave,
          phase: 'completed',
          completedBatches: cur.completedBatches + 1,
          completedAt: new Date().toISOString(),
        },
      },
      history: {
        ...prev.history,
        [key]: {
          ...prevHist,
          learnedIds: mergedLearned,
          completed: true,
        },
      },
    };
  };

  const completeStudyPhase = useCallback(
    (studiedIds: number[]) => {
      const goToQuiz = state.settings.includeQuiz;
      setState((prev) => {
        const key = getActiveDateKey(prev.simulatedDayOffset);
        const cur = prev.sessions[key];
        if (!cur) return prev;

        if (prev.settings.includeQuiz) {
          return {
            ...prev,
            sessions: {
              ...prev.sessions,
              [key]: {
                ...cur,
                studiedWordIds: studiedIds,
                phase: 'quiz',
              },
            },
          };
        }
        return finalizeBatchHelper(prev, key, studiedIds);
      });

      if (goToQuiz) {
        setOverlay({ type: 'quiz' });
      } else {
        setOverlay({ type: 'none' });
      }
    },
    [state.settings.includeQuiz],
  );

  const completeQuizPhase = useCallback(
    (masteredIds: number[], mistakeMap: Record<number, number>) => {
      setState((prev) => {
        const key = getActiveDateKey(prev.simulatedDayOffset);
        return finalizeBatchHelper(prev, key, masteredIds, mistakeMap);
      });
    },
    [],
  );

  const startExtraBatch = useCallback(() => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key] || createEmptySession(key, prev.settings.dailyGoal);
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [key]: {
            ...cur,
            targetCount: prev.settings.dailyGoal,
            phase: 'triage',
            selectedWordIds: [],
            knownWordIds: [],
            studiedWordIds: [],
            masteredWordIds: [],
            triageHistory: [],
          },
        },
      };
    });
    setOverlay({ type: 'triage' });
  }, []);

  const recordReviewResult = useCallback((wordId: number, remembered: boolean) => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const existing = prev.wordProgress[wordId];
      if (!existing) return prev;

      const nextInterval = remembered ? getNextInterval(existing.intervalDays || 1) : 1;
      const nextReviewDate = addDaysToKey(key, nextInterval);

      const prevHist: DayHistorySummary = prev.history[key] || {
        date: key,
        learnedIds: [],
        knownIds: [],
        reviewedIds: [],
        targetCount: prev.settings.dailyGoal,
        completed: false,
      };
      const nextReviewed = prevHist.reviewedIds.includes(wordId)
        ? prevHist.reviewedIds
        : [...prevHist.reviewedIds, wordId];

      return {
        ...prev,
        wordProgress: {
          ...prev.wordProgress,
          [wordId]: {
            ...existing,
            reviewCount: existing.reviewCount + 1,
            intervalDays: nextInterval,
            nextReviewDate,
            mistakes: (existing.mistakes || 0) + (remembered ? 0 : 1),
          },
        },
        history: {
          ...prev.history,
          [key]: {
            ...prevHist,
            reviewedIds: nextReviewed,
          },
        },
      };
    });
  }, []);

  const toggleFavorite = useCallback((wordId: number) => {
    setState((prev) => {
      const existing = prev.wordProgress[wordId];
      const nextFav = !existing?.favorite;
      return {
        ...prev,
        wordProgress: {
          ...prev.wordProgress,
          [wordId]: existing
            ? { ...existing, favorite: nextFav }
            : {
                status: 'new',
                reviewCount: 0,
                intervalDays: 0,
                favorite: nextFav,
              },
        },
      };
    });
  }, []);

  const setWordStatusManual = useCallback((wordId: number, status: WordStatus) => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const existing = prev.wordProgress[wordId];
      const nextProgress = { ...prev.wordProgress };

      if (status === 'new') {
        if (existing?.favorite) {
          nextProgress[wordId] = {
            status: 'new',
            reviewCount: 0,
            intervalDays: 0,
            favorite: true,
          };
        } else {
          delete nextProgress[wordId];
        }
      } else if (status === 'known') {
        nextProgress[wordId] = {
          reviewCount: existing?.reviewCount || 0,
          intervalDays: 0,
          favorite: existing?.favorite || false,
          status: 'known',
          knownAt: key,
        };
      } else if (status === 'learned') {
        nextProgress[wordId] = {
          reviewCount: Math.max(1, existing?.reviewCount || 1),
          intervalDays: existing?.intervalDays || 1,
          nextReviewDate: existing?.nextReviewDate || addDaysToKey(key, 1),
          favorite: existing?.favorite || false,
          status: 'learned',
          learnedAt: existing?.learnedAt || key,
        };
      }

      return { ...prev, wordProgress: nextProgress };
    });
  }, []);

  const addWordToTodaySelection = useCallback(
    (wordId: number): { added: boolean; message: string } => {
      if (todaySession.selectedWordIds.includes(wordId)) {
        return { added: false, message: 'Bu kelime zaten bugünkü çalışma listende.' };
      }

      const wasCompleted = todaySession.phase === 'completed';

      setState((prev) => {
        const key = getActiveDateKey(prev.simulatedDayOffset);
        const cur = prev.sessions[key] || createEmptySession(key, prev.settings.dailyGoal);
        if (cur.selectedWordIds.includes(wordId)) return prev;

        if (cur.phase === 'completed') {
          return {
            ...prev,
            wordProgress: {
              ...prev.wordProgress,
              [wordId]: {
                ...(prev.wordProgress[wordId] || { reviewCount: 0, intervalDays: 0 }),
                status: 'learning',
              },
            },
            sessions: {
              ...prev.sessions,
              [key]: {
                ...cur,
                phase: 'triage',
                selectedWordIds: [wordId],
                studiedWordIds: [],
                masteredWordIds: [],
                triageHistory: [{ wordId, action: 'learn' }],
              },
            },
          };
        }
        const nextSelected = [...cur.selectedWordIds, wordId];
        const nextPhase =
          cur.phase === 'triage' && nextSelected.length >= cur.targetCount ? 'ready' : cur.phase;
        return {
          ...prev,
          wordProgress: {
            ...prev.wordProgress,
            [wordId]: {
              ...(prev.wordProgress[wordId] || { reviewCount: 0, intervalDays: 0 }),
              status: 'learning',
            },
          },
          sessions: {
            ...prev.sessions,
            [key]: {
              ...cur,
              selectedWordIds: nextSelected,
              phase: nextPhase,
              triageHistory: [...cur.triageHistory, { wordId, action: 'learn' }],
            },
          },
        };
      });

      return wasCompleted
        ? { added: true, message: 'Yeni ekstra oturum oluşturuldu ve kelime eklendi!' }
        : { added: true, message: 'Bugünkü çalışma listene eklendi!' };
    },
    [todaySession.selectedWordIds, todaySession.phase],
  );

  const removeWordFromTodaySelection = useCallback((wordId: number) => {
    setState((prev) => {
      const key = getActiveDateKey(prev.simulatedDayOffset);
      const cur = prev.sessions[key];
      if (!cur || !cur.selectedWordIds.includes(wordId)) return prev;

      const nextSelected = cur.selectedWordIds.filter((id) => id !== wordId);
      const nextWordProg = { ...prev.wordProgress };
      const existing = nextWordProg[wordId];
      if (existing?.status === 'learning') {
        if (existing.favorite) {
          nextWordProg[wordId] = { ...existing, status: 'new' };
        } else {
          delete nextWordProg[wordId];
        }
      }

      return {
        ...prev,
        wordProgress: nextWordProg,
        sessions: {
          ...prev.sessions,
          [key]: {
            ...cur,
            selectedWordIds: nextSelected,
            phase:
              cur.phase === 'ready' && nextSelected.length < cur.targetCount
                ? 'triage'
                : cur.phase,
            triageHistory: cur.triageHistory.filter((h) => h.wordId !== wordId),
          },
        },
      };
    });
  }, []);

  const advanceSimulatedDay = useCallback((delta: number) => {
    setOverlay({ type: 'none' });
    setState((prev) => ({
      ...prev,
      simulatedDayOffset: prev.simulatedDayOffset + delta,
    }));
  }, []);

  const resetSimulatedDay = useCallback(() => {
    setOverlay({ type: 'none' });
    setState((prev) => ({
      ...prev,
      simulatedDayOffset: 0,
    }));
  }, []);

  const exportBackup = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importBackup = useCallback((jsonString: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString) as Partial<AppState>;
      if (!parsed || typeof parsed !== 'object' || !parsed.settings || !parsed.wordProgress) {
        return { ok: false, error: 'Geçersiz yedek dosyası formatı.' };
      }
      setState({
        version: 1,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        wordProgress: parsed.wordProgress || {},
        sessions: parsed.sessions || {},
        history: parsed.history || {},
        simulatedDayOffset: typeof parsed.simulatedDayOffset === 'number' ? parsed.simulatedDayOffset : 0,
      });
      setOverlay({ type: 'none' });
      return { ok: true };
    } catch {
      return { ok: false, error: 'JSON okunamadı. Dosyayı kontrol edin.' };
    }
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOverlay({ type: 'none' });
    setActiveTab('today');
    setState(DEFAULT_STATE);
  }, []);

  const value: AppStoreContextValue = {
    state,
    todayKey,
    todaySession,
    activeTab,
    setActiveTab,
    overlay,
    setOverlay,
    triageQueue,
    todaySelectedWords,
    dueReviewWords,
    streak,
    totals,
    completeOnboarding,
    updateSettings,
    triageLearn,
    triageKnown,
    undoTriage,
    startStudyFromReady,
    completeStudyPhase,
    completeQuizPhase,
    startExtraBatch,
    recordReviewResult,
    toggleFavorite,
    setWordStatusManual,
    addWordToTodaySelection,
    removeWordFromTodaySelection,
    advanceSimulatedDay,
    resetSimulatedDay,
    exportBackup,
    importBackup,
    resetAllData,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
