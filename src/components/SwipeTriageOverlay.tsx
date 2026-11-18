import React, { useEffect, useState, useCallback } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, getPosTurkish } from '../data/words';
import { speakEnglish } from '../utils/speech';
import { CuteCelebrationIllustration } from './BrandMark';
import type { WordItem } from '../types';

interface DraggableWordCardProps {
  word: WordItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSwipe: (dir: 'left' | 'right') => void;
  exitDir: 'left' | 'right' | null;
  accent: 'en-US' | 'en-GB';
  speechRate: number;
  peekMeaning: boolean;
  onTogglePeek: () => void;
}

const DraggableWordCard: React.FC<DraggableWordCardProps> = ({
  word,
  isFavorite,
  onToggleFavorite,
  onSwipe,
  exitDir,
  accent,
  speechRate,
  peekMeaning,
  onTogglePeek,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const learnOpacity = useTransform(x, [-110, -24], [1, 0]);
  const knownOpacity = useTransform(x, [24, 110], [0, 1]);
  const borderColor = useTransform(
    x,
    [-110, 0, 110],
    ['#60A5FA', '#DCE7F7', '#5EEAD4'],
  );

  const meta = CEFR_META[word.lvl];

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -82 || info.velocity.x < -420) {
      onSwipe('left');
    } else if (info.offset.x > 82 || info.velocity.x > 420) {
      onSwipe('right');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, borderColor }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.94, opacity: 0, y: 18 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{
        x: exitDir === 'right' ? 360 : -360,
        rotate: exitDir === 'right' ? 18 : -18,
        opacity: 0,
        transition: { duration: 0.24, ease: 'easeOut' },
      }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-card border-2 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Dynamic Drag Stamps */}
      <motion.div
        style={{ opacity: learnOpacity }}
        className="pointer-events-none absolute top-5 right-5 z-20 rounded-xl border-2 border-[#2563EB] bg-[#EFF6FF] px-3 py-1 text-xs font-extrabold tracking-wider text-[#1D4ED8] rotate-6"
      >
        ÖĞREN
      </motion.div>
      <motion.div
        style={{ opacity: knownOpacity }}
        className="pointer-events-none absolute top-5 left-5 z-20 rounded-xl border-2 border-[#0D9488] bg-[#F0FDFA] px-3 py-1 text-xs font-extrabold tracking-wider text-[#0F766E] -rotate-6"
      >
        BİLİYORUM
      </motion.div>

      {/* Top Row: CEFR, POS, Favorite */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
          >
            {word.lvl}
          </span>
          <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
            {getPosTurkish(word.pos)}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onToggleFavorite}
          aria-label="Favorilere ekle"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
            isFavorite
              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] hover:text-[#2563EB]'
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-[#2563EB]' : ''}`} />
        </button>
      </div>

      {/* Center: Word + Audio + Optional Peek */}
      <div className="flex flex-col items-center text-center my-auto py-4">
        <h2 className="font-display text-3xl sm:text-[34px] font-extrabold tracking-tight text-[#0F172A] break-words max-w-full px-2">
          {word.w}
        </h2>
        <p className="mt-1 text-xs font-medium text-[#94A3B8]">{word.pos}</p>

        {/* Audio controls */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => speakEnglish(word.w, accent, speechRate)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3.5 py-2 text-xs font-bold text-[#2563EB] border border-[#DBEAFE] hover:bg-[#DBEAFE] active:scale-95 transition"
          >
            <Volume2 className="h-4 w-4" />
            Dinle
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => speakEnglish(word.w, accent, 0.65)}
            className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#64748B] border border-[#E2E8F0] hover:bg-[#EFF6FF] hover:text-[#2563EB] active:scale-95 transition"
          >
            Yavaş
          </button>
        </div>

        {/* Peek Turkish meaning helper */}
        <div className="mt-5 w-full flex flex-col items-center min-h-[62px] justify-center">
          <AnimatePresence mode="wait">
            {peekMeaning ? (
              <motion.div
                key="peek-shown"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="w-full rounded-2xl bg-[#F4F8FF] border border-[#DBEAFE] px-4 py-2.5 text-center"
              >
                <div className="text-sm font-bold text-[#1E40AF]">{word.tr}</div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onTogglePeek}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#2563EB]"
                >
                  <EyeOff className="h-3 w-3" />
                  Gizle
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="peek-hidden"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onTogglePeek}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F4F8FF] hover:text-[#2563EB] transition"
              >
                <Eye className="h-3.5 w-3.5" />
                Emin değil misin? Anlamına göz at
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subtle swipe direction hints inside card footer */}
      <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1 text-[#2563EB]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Bilmiyorum
        </span>
        <span className="inline-flex items-center gap-1 text-[#0D9488]">
          Biliyorum
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.div>
  );
};

export const SwipeTriageOverlay: React.FC = () => {
  const {
    state,
    todaySession,
    triageQueue,
    todaySelectedWords,
    triageLearn,
    triageKnown,
    undoTriage,
    startStudyFromReady,
    toggleFavorite,
    removeWordFromTodaySelection,
    setOverlay,
  } = useAppStore();

  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const [peekMeaning, setPeekMeaning] = useState(false);

  const currentWord = triageQueue[0];
  const nextWord = triageQueue[1];
  const thirdWord = triageQueue[2];

  const isReady =
    todaySession.phase === 'ready' ||
    todaySession.selectedWordIds.length >= todaySession.targetCount;

  const progressPct = Math.min(
    100,
    Math.round((todaySession.selectedWordIds.length / Math.max(1, todaySession.targetCount)) * 100),
  );

  // Reset peek when current card changes
  useEffect(() => {
    setPeekMeaning(false);
    if (currentWord && state.settings.autoSpeak && !isReady) {
      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
    }
  }, [currentWord?.id, isReady, state.settings.autoSpeak, state.settings.accent, state.settings.speechRate]);

  const handleAction = useCallback(
    (dir: 'left' | 'right') => {
      if (!currentWord || isReady) return;
      setExitDir(dir);
      if (dir === 'left') {
        triageLearn(currentWord.id);
      } else {
        triageKnown(currentWord.id);
      }
    },
    [currentWord, isReady, triageLearn, triageKnown],
  );

  // PC Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setOverlay({ type: 'none' });
        return;
      }
      if (isReady) {
        if (e.key === 'Enter') {
          e.preventDefault();
          startStudyFromReady();
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAction('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAction('right');
      } else if (e.key === ' ') {
        e.preventDefault();
        setPeekMeaning((p) => !p);
      } else if (e.key.toLowerCase() === 's' && currentWord) {
        e.preventDefault();
        speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
      } else if ((e.key.toLowerCase() === 'z' || e.key === 'Backspace') && todaySession.triageHistory.length > 0) {
        e.preventDefault();
        undoTriage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isReady,
    handleAction,
    currentWord,
    todaySession.triageHistory.length,
    undoTriage,
    startStudyFromReady,
    setOverlay,
    state.settings.accent,
    state.settings.speechRate,
  ]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
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
            <div className="text-xs font-bold text-[#0F172A]">
              {isReady ? 'Günlük Liste Hazır' : 'Bugünün Kelimelerini Seç'}
            </div>
            <div className="text-[11px] font-medium text-[#64748B]">
              Seçilen:{' '}
              <span className="font-bold text-[#2563EB]">
                {todaySession.selectedWordIds.length}/{todaySession.targetCount}
              </span>
              {' · '}
              Bilinen:{' '}
              <span className="font-semibold text-[#0D9488]">
                {todaySession.knownWordIds.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={todaySession.triageHistory.length === 0}
            onClick={undoTriage}
            title="Son işlemi geri al (Z)"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#475569] shadow-soft border border-[#E2ECF9] hover:bg-[#F8FAFC] disabled:opacity-35 disabled:pointer-events-none active:scale-95 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E2ECF9]">
          <motion.div
            className="h-full rounded-full bg-[#2563EB]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
        </div>
      </div>

      {/* Main Stage */}
      {isReady ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col justify-between px-5 pb-6 pt-2 overflow-hidden"
        >
          <div className="flex flex-col items-center text-center">
            <CuteCelebrationIllustration className="w-36 h-28" />
            <h2 className="mt-1 font-display text-xl font-extrabold text-[#0F172A]">
              Harika! {todaySelectedWords.length} Kelime Seçildi
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B] max-w-[290px]">
              Bilmediğin {todaySelectedWords.length} kelime toplandı. Şimdi sesli telaffuz, Türkçe anlam ve örnek cümlelerle bunları öğrenelim!
            </p>
          </div>

          {/* Selected words preview chips */}
          <div className="my-4 flex-1 overflow-y-auto no-scrollbar rounded-2xl bg-white border border-[#E2ECF9] p-3.5 shadow-soft">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <BookMarked className="h-3.5 w-3.5 text-[#2563EB]" />
                Öğrenilecek Kelimeler
              </span>
              <span className="text-[#2563EB]">{todaySelectedWords.length} kelime</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {todaySelectedWords.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] pl-2.5 pr-1.5 py-1 text-xs font-semibold text-[#1E3A8A]"
                >
                  {w.w}
                  <button
                    type="button"
                    onClick={() => removeWordFromTodaySelection(w.id)}
                    title="Listeden çıkar"
                    className="rounded-full p-0.5 text-[#93C5FD] hover:bg-[#DBEAFE] hover:text-[#1D4ED8] transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startStudyFromReady}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
          >
            Kartlarla Öğrenmeye Başla
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      ) : !currentWord ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <CuteCelebrationIllustration className="w-36 h-28" />
          <h3 className="mt-2 font-display text-lg font-extrabold text-[#0F172A]">
            Tüm Oxford 3000 Kelimelerini Taradın!
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            Yeni kelime kalmadı. Seçtiğin mevcut kelimelerle çalışabilir veya Sözlükten tekrar seçebilirsin.
          </p>
          {todaySelectedWords.length > 0 && (
            <button
              type="button"
              onClick={startStudyFromReady}
              className="mt-5 rounded-2xl bg-[#2563EB] px-6 py-3 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8]"
            >
              Seçili {todaySelectedWords.length} Kelimeyi Öğren
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Swipe Card Stack */}
          <div className="relative flex flex-1 items-center justify-center px-5 py-2">
            <div className="relative h-[380px] w-full max-w-[330px]">
              {/* 3rd card shadow layer */}
              {thirdWord && (
                <div className="pointer-events-none absolute inset-0 translate-y-4 scale-[0.90] rounded-[28px] bg-[#EFF6FF] border border-[#DBEAFE] opacity-70" />
              )}
              {/* 2nd card layer */}
              {nextWord && (
                <div className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.95] rounded-[28px] bg-white border border-[#E2ECF9] shadow-soft flex flex-col items-center justify-center opacity-90">
                  <span className="font-display text-2xl font-bold text-[#CBD5E1]">
                    {nextWord.w}
                  </span>
                </div>
              )}

              {/* Active draggable card */}
              <AnimatePresence custom={exitDir} mode="popLayout">
                <DraggableWordCard
                  key={currentWord.id}
                  word={currentWord}
                  isFavorite={Boolean(state.wordProgress[currentWord.id]?.favorite)}
                  onToggleFavorite={() => toggleFavorite(currentWord.id)}
                  onSwipe={handleAction}
                  exitDir={exitDir}
                  accent={state.settings.accent}
                  speechRate={state.settings.speechRate}
                  peekMeaning={peekMeaning}
                  onTogglePeek={() => setPeekMeaning((p) => !p)}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Tactile Action Bar */}
          <div className="px-5 pb-6 pt-2">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleAction('left')}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 px-4 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.97] transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Bilmiyorum
              </button>

              <button
                type="button"
                onClick={() => handleAction('right')}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-4 text-sm font-bold text-[#0F766E] border-2 border-[#CCFBF1] shadow-soft hover:bg-[#F0FDFA] hover:border-[#99F6E4] active:scale-[0.97] transition"
              >
                <Check className="h-4 w-4" />
                Biliyorum
              </button>
            </div>

            <p className="mt-2.5 text-center text-[11px] font-medium text-[#94A3B8]">
              Kartı sola/sağa kaydır veya butonlara dokun
            </p>
          </div>
        </>
      )}
    </div>
  );
};
