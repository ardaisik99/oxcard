import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Check,
  Flame,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, WORD_BY_ID, getPosTurkish, getQuizOptions } from '../data/words';
import { speakEnglish } from '../utils/speech';
import { CuteCelebrationIllustration } from './BrandMark';
import type { WordItem } from '../types';

export const QuizOverlay: React.FC = () => {
  const {
    state,
    todaySelectedWords,
    completeQuizPhase,
    streak,
    setOverlay,
  } = useAppStore();

  const initialIds = useMemo(() => {
    const ids = todaySelectedWords.map((w) => w.id);
    // Shuffle order for quiz recall
    const copy = [...ids];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [todaySelectedWords]);

  const [queue, setQueue] = useState<number[]>(initialIds);
  const [passedIds, setPassedIds] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentId = queue[0];
  const currentWord = currentId ? WORD_BY_ID.get(currentId) : undefined;

  const options = useMemo<WordItem[]>(() => {
    if (!currentWord) return [];
    return getQuizOptions(currentWord, 4);
  }, [currentWord?.id, queue.length]);

  const totalCount = Math.max(1, initialIds.length);
  const progressPct = Math.min(100, Math.round((passedIds.length / totalCount) * 100));

  useEffect(() => {
    if (currentWord && state.settings.autoSpeak && !isCompleted) {
      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
    }
  }, [currentWord?.id, isCompleted, state.settings.autoSpeak, state.settings.accent, state.settings.speechRate]);

  const advanceNext = useCallback(
    (wasCorrect: boolean, wordId: number) => {
      if (wasCorrect) {
        const nextPassed = passedIds.includes(wordId) ? passedIds : [...passedIds, wordId];
        setPassedIds(nextPassed);
        const rest = queue.slice(1);
        setQueue(rest);
        if (rest.length === 0) {
          setIsCompleted(true);
          completeQuizPhase(initialIds, mistakes);
        }
      } else {
        // Put missed word back near the end of the queue
        const rest = queue.slice(1);
        setQueue([...rest, wordId]);
      }
      setSelectedOptionId(null);
    },
    [queue, passedIds, initialIds, mistakes, completeQuizPhase],
  );

  const handleSelectOption = useCallback(
    (option: WordItem) => {
      if (!currentWord || selectedOptionId !== null) return;
      setSelectedOptionId(option.id);
      const isCorrect = option.id === currentWord.id;
      setTotalAttempts((n) => n + 1);

      if (isCorrect) {
        setCorrectAttempts((n) => n + 1);
        setTimeout(() => advanceNext(true, currentWord.id), 550);
      } else {
        setMistakes((prev) => ({
          ...prev,
          [currentWord.id]: (prev[currentWord.id] || 0) + 1,
        }));
        setTimeout(() => advanceNext(false, currentWord.id), 1250);
      }
    },
    [currentWord, selectedOptionId, advanceNext],
  );

  // PC Keyboard shortcuts: 1-4 for options, S for audio, Esc to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setOverlay({ type: 'none' });
        return;
      }
      if (isCompleted) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setOverlay({ type: 'none' });
        }
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (options[idx]) {
          e.preventDefault();
          handleSelectOption(options[idx]);
        }
      } else if (e.key.toLowerCase() === 's' && currentWord) {
        e.preventDefault();
        speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isCompleted,
    options,
    currentWord,
    handleSelectOption,
    setOverlay,
    state.settings.accent,
    state.settings.speechRate,
  ]);

  if (isCompleted || !currentWord) {
    const accuracy =
      totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;

    return (
      <div className="flex h-full flex-col justify-between bg-gradient-to-b from-[#EFF6FF] via-[#F9FBFF] to-white px-5 py-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOverlay({ type: 'none' })}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#475569] shadow-soft border border-[#E2ECF9]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center my-auto"
        >
          <CuteCelebrationIllustration className="w-44 h-34" />
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#2563EB] shadow-soft border border-[#DBEAFE]">
            <Sparkles className="h-3.5 w-3.5" />
            Günlük Hedef Tamamlandı
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-[#0F172A]">
            Harika Bir İş Çıkardın!
          </h2>
          <p className="mt-1.5 max-w-[290px] text-xs leading-relaxed text-[#64748B]">
            Bugünün {initialIds.length} yeni kelimesini başarıyla öğrendin ve hafızana kaydettin. Yarın yeni kelimeler ve kısa bir tekrar seni bekliyor.
          </p>

          {/* Metrics Row */}
          <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E2ECF9]">
              <div className="flex items-center justify-center text-[#2563EB] mb-1">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div className="font-display text-xl font-extrabold text-[#0F172A]">
                {initialIds.length}
              </div>
              <div className="text-[10px] font-semibold text-[#64748B]">Öğrenilen</div>
            </div>

            <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E2ECF9]">
              <div className="flex items-center justify-center text-[#0D9488] mb-1">
                <Check className="h-4.5 w-4.5" />
              </div>
              <div className="font-display text-xl font-extrabold text-[#0F172A]">
                %{accuracy}
              </div>
              <div className="text-[10px] font-semibold text-[#64748B]">Doğruluk</div>
            </div>

            <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E2ECF9]">
              <div className="flex items-center justify-center text-[#3B82F6] mb-1">
                <Flame className="h-4.5 w-4.5" />
              </div>
              <div className="font-display text-xl font-extrabold text-[#0F172A]">
                {Math.max(1, streak)}
              </div>
              <div className="text-[10px] font-semibold text-[#64748B]">Gün Seri</div>
            </div>
          </div>
        </motion.div>

        <button
          type="button"
          onClick={() => setOverlay({ type: 'none' })}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
        >
          Ana Sayfaya Dön
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const meta = CEFR_META[currentWord.lvl];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOverlay({ type: 'none' })}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#475569] shadow-soft border border-[#E2ECF9]"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="text-center">
            <div className="text-xs font-bold text-[#0F172A]">Hızlı Pekiştirme Testi</div>
            <div className="text-[11px] font-medium text-[#64748B]">
              Tamamlanan:{' '}
              <span className="font-bold text-[#2563EB]">
                {passedIds.length}/{totalCount}
              </span>
            </div>
          </div>

          <div className="w-9" />
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E2ECF9]">
          <motion.div
            className="h-full rounded-full bg-[#2563EB]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex flex-1 flex-col justify-between px-5 pb-6 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentWord.id}-${queue.length}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col justify-between"
          >
            <div className="rounded-[26px] bg-white p-6 shadow-card border border-[#DCE7F7] text-center">
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  {currentWord.lvl}
                </span>
                <span className="rounded-full bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
                  {getPosTurkish(currentWord.pos)}
                </span>
              </div>

              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0F172A]">
                {currentWord.w}
              </h2>

              <button
                type="button"
                onClick={() =>
                  speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate)
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-bold text-[#2563EB] border border-[#DBEAFE] hover:bg-[#DBEAFE] active:scale-95 transition"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Dinle
              </button>

              <p className="mt-4 text-[11px] font-medium text-[#94A3B8]">
                Doğru Türkçe karşılığını seç
              </p>
            </div>

            {/* 4 Options */}
            <div className="mt-5 space-y-2.5">
              {options.map((opt, idx) => {
                const isPicked = selectedOptionId === opt.id;
                const isCorrect = opt.id === currentWord.id;
                const answered = selectedOptionId !== null;

                let btnStyle =
                  'bg-white border-[#DCE7F7] text-[#0F172A] hover:border-[#93C5FD] hover:bg-[#F8FAFF]';

                if (answered) {
                  if (isCorrect) {
                    btnStyle = 'bg-[#F0FDFA] border-[#0D9488] text-[#0F766E] shadow-soft';
                  } else if (isPicked && !isCorrect) {
                    btnStyle = 'bg-[#FFF7ED] border-[#F59E0B] text-[#B45309]';
                  } else {
                    btnStyle = 'bg-white/70 border-[#E2E8F0] text-[#94A3B8]';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={answered}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.98] ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          answered && isCorrect
                            ? 'bg-[#0D9488] text-white'
                            : answered && isPicked
                              ? 'bg-[#F59E0B] text-white'
                              : 'bg-[#EFF6FF] text-[#2563EB]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold truncate">{opt.tr}</span>
                    </div>
                    {answered && isCorrect && (
                      <Check className="h-4.5 w-4.5 shrink-0 text-[#0D9488]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
