import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  RefreshCw,
  RotateCw,
  Sparkles,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, WORD_BY_ID, getPosTurkish } from '../data/words';
import { speakEnglish } from '../utils/speech';
import { CuteCelebrationIllustration } from './BrandMark';

export const StudyFlashcardsOverlay: React.FC = () => {
  const {
    state,
    todaySelectedWords,
    completeStudyPhase,
    completeQuizPhase,
    toggleFavorite,
    setOverlay,
  } = useAppStore();

  const initialIds = useMemo(
    () => todaySelectedWords.map((w) => w.id),
    [todaySelectedWords],
  );

  const [queue, setQueue] = useState<number[]>(initialIds);
  const [learnedInSession, setLearnedInSession] = useState<number[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [requeueToast, setRequeueToast] = useState<string | null>(null);
  const [finishedCards, setFinishedCards] = useState(false);

  // If queue becomes empty cleanly
  const currentId = queue[0];
  const currentWord = currentId ? WORD_BY_ID.get(currentId) : undefined;
  const totalCount = Math.max(1, initialIds.length);
  const progressPct = Math.min(100, Math.round((learnedInSession.length / totalCount) * 100));

  useEffect(() => {
    setIsFlipped(false);
    if (currentWord && state.settings.autoSpeak) {
      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
    }
  }, [currentWord?.id, state.settings.autoSpeak, state.settings.accent, state.settings.speechRate]);

  useEffect(() => {
    if (!requeueToast) return;
    const t = setTimeout(() => setRequeueToast(null), 1500);
    return () => clearTimeout(t);
  }, [requeueToast]);

  const handleRepeatLater = useCallback(() => {
    if (!currentId) return;
    setQueue((prev) => {
      const [, ...rest] = prev;
      // Re-insert 3 cards ahead (or at end if fewer remain)
      const insertAt = Math.min(3, rest.length);
      const next = [...rest];
      next.splice(insertAt, 0, currentId);
      return next;
    });
    setIsFlipped(false);
    setRequeueToast('Birazdan tekrar sorulacak');
  }, [currentId]);

  const handleMarkLearned = useCallback(() => {
    if (!currentId) return;
    const nextLearned = learnedInSession.includes(currentId)
      ? learnedInSession
      : [...learnedInSession, currentId];
    setLearnedInSession(nextLearned);
    const rest = queue.slice(1);
    setQueue(rest);
    if (rest.length === 0) {
      setFinishedCards(true);
    }
    setIsFlipped(false);
  }, [currentId, queue, learnedInSession]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setOverlay({ type: 'none' });
        return;
      }
      if (finishedCards) {
        if (e.key === 'Enter') {
          e.preventDefault();
          completeStudyPhase(learnedInSession);
        }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key.toLowerCase() === 's' && currentWord) {
        e.preventDefault();
        speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
      } else if (isFlipped && (e.key === 'ArrowLeft' || e.key === '1')) {
        e.preventDefault();
        handleRepeatLater();
      } else if (isFlipped && (e.key === 'ArrowRight' || e.key === '2')) {
        e.preventDefault();
        handleMarkLearned();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    finishedCards,
    isFlipped,
    currentWord,
    learnedInSession,
    handleRepeatLater,
    handleMarkLearned,
    completeStudyPhase,
    setOverlay,
    state.settings.accent,
    state.settings.speechRate,
  ]);

  if (finishedCards || !currentWord) {
    return (
      <div className="flex h-full flex-col justify-between bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white px-5 py-6">
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

        <div className="flex flex-col items-center text-center my-auto">
          <CuteCelebrationIllustration className="w-40 h-32" />
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#2563EB] border border-[#DBEAFE]">
            <Sparkles className="h-3.5 w-3.5" />
            Kartlar Tamamlandı
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-[#0F172A]">
            {initialIds.length} Kelimeyi Çalıştın!
          </h2>
          <p className="mt-2 max-w-[290px] text-xs leading-relaxed text-[#64748B]">
            {state.settings.includeQuiz
              ? 'Şimdi 1 dakikalık hızlı pekiştirme testiyle kelimeleri kalıcı hafızaya kaydedelim.'
              : 'Harika iş! Kelimelerin kaydedildi ve yarınki akıllı tekrara eklendi.'}
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => completeStudyPhase(initialIds)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
          >
            {state.settings.includeQuiz ? 'Pekiştirme Testine Geç' : 'Kaydet ve Tamamla'}
            <ArrowRight className="h-4 w-4" />
          </button>

          {state.settings.includeQuiz && (
            <button
              type="button"
              onClick={() => {
                completeQuizPhase(initialIds, {});
                setOverlay({ type: 'none' });
              }}
              className="w-full rounded-2xl py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition"
            >
              Testi atla, şimdi kaydet
            </button>
          )}
        </div>
      </div>
    );
  }

  const meta = CEFR_META[currentWord.lvl];
  const isFav = Boolean(state.wordProgress[currentWord.id]?.favorite);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOverlay({ type: 'none' })}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#475569] shadow-soft border border-[#E2ECF9] hover:bg-[#F8FAFC] active:scale-95 transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="text-center">
            <div className="text-xs font-bold text-[#0F172A]">Kelime Kartları</div>
            <div className="text-[11px] font-medium text-[#64748B]">
              Öğrenilen:{' '}
              <span className="font-bold text-[#2563EB]">
                {learnedInSession.length}/{totalCount}
              </span>
              {' · '}
              Kalan: <span className="font-semibold text-[#475569]">{queue.length}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(currentWord.id)}
            aria-label="Favori"
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-soft transition ${
              isFav
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                : 'bg-white border-[#E2ECF9] text-[#94A3B8] hover:text-[#2563EB]'
            }`}
          >
            <Star className={`h-4 w-4 ${isFav ? 'fill-[#2563EB]' : ''}`} />
          </button>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E2ECF9]">
          <motion.div
            className="h-full rounded-full bg-[#2563EB]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          />
        </div>
      </div>

      {/* Requeue subtle toast */}
      <div className="h-6 flex items-center justify-center px-4">
        <AnimatePresence>
          {requeueToast && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-0.5 text-[11px] font-semibold text-[#1D4ED8]"
            >
              {requeueToast}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Flip Card Stage */}
      <div className="flex flex-1 items-center justify-center px-5 py-1">
        <div
          className="perspective-1200 w-full max-w-[340px] h-[400px] cursor-pointer"
          onClick={() => setIsFlipped((f) => !f)}
        >
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full transform-style-3d"
          >
            {/* FRONT FACE */}
            <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-card border border-[#DCE7F7]">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  {meta.label}
                </span>
                <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
                  {getPosTurkish(currentWord.pos)}
                </span>
              </div>

              <div className="flex flex-col items-center text-center my-auto">
                <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#0F172A] break-words max-w-full">
                  {currentWord.w}
                </h2>
                <p className="mt-1.5 text-xs font-medium text-[#94A3B8]">
                  {currentWord.pos}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-4 py-2 text-xs font-bold text-[#2563EB] border border-[#DBEAFE] hover:bg-[#DBEAFE] active:scale-95 transition"
                  >
                    <Volume2 className="h-4 w-4" />
                    Dinle
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(currentWord.w, state.settings.accent, 0.65);
                    }}
                    className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#64748B] border border-[#E2E8F0] hover:bg-[#EFF6FF] hover:text-[#2563EB] active:scale-95 transition"
                  >
                    Yavaş
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#F8FAFF] py-2.5 text-xs font-semibold text-[#64748B] border border-[#EAF1FB]">
                <RotateCw className="h-3.5 w-3.5 text-[#2563EB]" />
                Anlamını görmek için karta dokun
              </div>
            </div>

            {/* BACK FACE */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-card border-2 border-[#BFDBFE] overflow-y-auto no-scrollbar">
              <div>
                {/* Word header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFF6FF]">
                  <div>
                    <div className="font-display text-lg font-extrabold text-[#0F172A]">
                      {currentWord.w}
                    </div>
                    <div className="text-[11px] font-medium text-[#94A3B8]">
                      {getPosTurkish(currentWord.pos)} • {currentWord.lvl}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] active:scale-95 transition"
                    aria-label="Kelimeyi dinle"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Big Turkish meaning */}
                <div className="mt-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Türkçe Anlamı
                  </div>
                  <div className="mt-0.5 font-display text-2xl font-extrabold text-[#1D4ED8] leading-snug">
                    {currentWord.tr}
                  </div>
                </div>

                {/* English definition */}
                <p className="mt-2.5 text-xs leading-relaxed text-[#475569]">
                  {currentWord.def}
                </p>

                {/* Example sentence */}
                <div className="mt-3.5 rounded-2xl bg-[#F4F8FF] p-3 border border-[#E2ECF9]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                      Örnek Cümle
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(currentWord.ex, state.settings.accent, 0.92);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-[#DBEAFE] hover:bg-[#EFF6FF]"
                    >
                      <Volume2 className="h-3 w-3" />
                      Dinle
                    </button>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-[#0F172A]">
                    &ldquo;{currentWord.ex}&rdquo;
                  </p>
                </div>

                {/* Collocations or Synonyms */}
                {((currentWord.col && currentWord.col.length > 0) ||
                  (currentWord.syn && currentWord.syn.length > 0)) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentWord.col?.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className="rounded-lg bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1E40AF]"
                      >
                        {c}
                      </span>
                    ))}
                    {currentWord.syn?.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]"
                      >
                        ≈ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-5 pb-6 pt-3">
        {!isFlipped ? (
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
          >
            <RotateCw className="h-4 w-4" />
            Anlamı Göster
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRepeatLater}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 px-3 text-sm font-bold text-[#475569] border-2 border-[#DCE7F7] shadow-soft hover:bg-[#F8FAFF] hover:text-[#2563EB] active:scale-[0.97] transition"
            >
              <RefreshCw className="h-4 w-4" />
              Tekrar Göster
            </button>

            <button
              type="button"
              onClick={handleMarkLearned}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3.5 px-3 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.97] transition"
            >
              <Check className="h-4 w-4" />
              Öğrendim
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
