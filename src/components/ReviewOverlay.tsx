import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  RefreshCw,
  RotateCw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, WORD_BY_ID, getPosTurkish } from '../data/words';
import { speakEnglish } from '../utils/speech';
import { CuteCelebrationIllustration } from './BrandMark';

export const ReviewOverlay: React.FC = () => {
  const { state, dueReviewWords, recordReviewResult, setOverlay } = useAppStore();

  const initialIds = useMemo(() => dueReviewWords.map((w) => w.id), []);
  const [queue, setQueue] = useState<number[]>(initialIds);
  const [completedCount, setCompletedCount] = useState(0);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentId = queue[0];
  const currentWord = currentId ? WORD_BY_ID.get(currentId) : undefined;
  const totalCount = Math.max(1, initialIds.length);
  const progressPct = Math.min(100, Math.round((completedCount / totalCount) * 100));

  useEffect(() => {
    setIsFlipped(false);
    if (currentWord && state.settings.autoSpeak) {
      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
    }
  }, [currentWord?.id, state.settings.autoSpeak, state.settings.accent, state.settings.speechRate]);

  const handleAnswer = useCallback(
    (remembered: boolean) => {
      if (!currentId) return;
      recordReviewResult(currentId, remembered);
      if (remembered) {
        setRememberedCount((n) => n + 1);
      }
      setCompletedCount((n) => n + 1);
      setQueue((prev) => prev.slice(1));
      setIsFlipped(false);
    },
    [currentId, recordReviewResult],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setOverlay({ type: 'none' });
        return;
      }
      if (!currentWord) {
        if (e.key === 'Enter') setOverlay({ type: 'none' });
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
      } else if (isFlipped && (e.key === 'ArrowLeft' || e.key === '1')) {
        e.preventDefault();
        handleAnswer(false);
      } else if (isFlipped && (e.key === 'ArrowRight' || e.key === '2')) {
        e.preventDefault();
        handleAnswer(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentWord, isFlipped, handleAnswer, setOverlay, state.settings.accent, state.settings.speechRate]);

  if (!currentWord) {
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

        <div className="flex flex-col items-center text-center my-auto">
          <CuteCelebrationIllustration className="w-40 h-32" />
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#2563EB] border border-[#DBEAFE]">
            <Sparkles className="h-3.5 w-3.5" />
            Tekrar Tamamlandı
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-[#0F172A]">
            Hafızan Taptaze!
          </h2>
          <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-[#64748B]">
            <strong className="text-[#1D4ED8]">{completedCount}</strong> kelimeden{' '}
            <strong className="text-[#0D9488]">{rememberedCount}</strong> tanesini başarıyla hatırladın. Hatırladıkların daha uzun aralıklara taşındı!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOverlay({ type: 'none' })}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] transition"
        >
          Ana Sayfaya Dön
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const meta = CEFR_META[currentWord.lvl];
  const prog = state.wordProgress[currentWord.id];

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOverlay({ type: 'none' })}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#475569] shadow-soft border border-[#E2ECF9]"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="text-center">
            <div className="text-xs font-bold text-[#0F172A]">Akıllı Tekrar</div>
            <div className="text-[11px] font-medium text-[#64748B]">
              İlerleme:{' '}
              <span className="font-bold text-[#2563EB]">
                {completedCount}/{totalCount}
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
            transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          />
        </div>
      </div>

      {/* Flip Card */}
      <div className="flex flex-1 items-center justify-center px-5 py-2">
        <div
          className="perspective-1200 w-full max-w-[340px] h-[390px] cursor-pointer"
          onClick={() => setIsFlipped((f) => !f)}
        >
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full transform-style-3d"
          >
            {/* FRONT */}
            <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-card border border-[#DCE7F7]">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  {currentWord.lvl}
                </span>
                <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
                  Tekrar #{(prog?.reviewCount || 1)}
                </span>
              </div>

              <div className="flex flex-col items-center text-center my-auto">
                <h2 className="font-display text-4xl font-extrabold text-[#0F172A]">
                  {currentWord.w}
                </h2>
                <p className="mt-1 text-xs font-medium text-[#94A3B8]">
                  {getPosTurkish(currentWord.pos)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-4 py-2 text-xs font-bold text-[#2563EB] border border-[#DBEAFE]"
                >
                  <Volume2 className="h-4 w-4" />
                  Dinle
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#F8FAFF] py-2.5 text-xs font-semibold text-[#64748B] border border-[#EAF1FB]">
                <RotateCw className="h-3.5 w-3.5 text-[#2563EB]" />
                Hatırlamaya çalış, sonra karta dokun
              </div>
            </div>

            {/* BACK */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-card border-2 border-[#BFDBFE]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#EFF6FF]">
                  <div className="font-display text-lg font-extrabold text-[#0F172A]">
                    {currentWord.w}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(currentWord.w, state.settings.accent, state.settings.speechRate);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Türkçe Karşılığı
                  </div>
                  <div className="mt-1 font-display text-2xl font-extrabold text-[#1D4ED8]">
                    {currentWord.tr}
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-[#475569]">
                  {currentWord.def}
                </p>

                <div className="mt-4 rounded-2xl bg-[#F4F8FF] p-3 border border-[#E2ECF9]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] mb-1">
                    Örnek Cümle
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-[#0F172A]">
                    &ldquo;{currentWord.ex}&rdquo;
                  </p>
                </div>
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] transition"
          >
            <RotateCw className="h-4 w-4" />
            Cevabı Gör
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 px-3 text-sm font-bold text-[#475569] border-2 border-[#DCE7F7] hover:bg-[#F8FAFF] transition"
            >
              <RefreshCw className="h-4 w-4" />
              Unuttum
            </button>

            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3.5 px-3 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] transition"
            >
              <Check className="h-4 w-4" />
              Hatırladım
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
