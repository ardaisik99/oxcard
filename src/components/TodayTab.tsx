import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  formatTurkishDate,
  getLast7DateKeys,
  getShortDayName,
} from '../utils/dates';
import { CEFR_META, WORD_BY_ID } from '../data/words';
import { speakEnglish } from '../utils/speech';

export const TodayTab: React.FC = () => {
  const {
    state,
    todayKey,
    todaySession,
    todaySelectedWords,
    dueReviewWords,
    streak,
    totals,
    setOverlay,
    startStudyFromReady,
    startExtraBatch,
  } = useAppStore();

  const last7Keys = getLast7DateKeys(todayKey);
  const todayHist = state.history[todayKey];
  const todayLearnedCount = todayHist?.learnedIds.length || 0;
  const todayKnownCount = todayHist?.knownIds.length || 0;

  // Compute progress ring percentage for current mission
  let ringValue = 0;
  let ringLabel = `${todaySession.selectedWordIds.length}/${todaySession.targetCount}`;
  let ringSub = 'seçildi';

  if (todaySession.phase === 'completed') {
    ringValue = 100;
    ringLabel = `${todayLearnedCount}`;
    ringSub = 'öğrenildi';
  } else if (todaySession.phase === 'quiz') {
    ringValue = 85;
    ringLabel = 'Son';
    ringSub = 'test';
  } else if (todaySession.phase === 'study' || todaySession.phase === 'ready') {
    ringValue = 65;
    ringLabel = `${todaySession.selectedWordIds.length}`;
    ringSub = 'hazır';
  } else {
    ringValue = Math.round(
      (todaySession.selectedWordIds.length / Math.max(1, todaySession.targetCount)) * 100,
    );
  }

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringValue / 100) * circumference;

  const greetingName = state.settings.userName ? `, ${state.settings.userName}` : '';

  // Words to list below (either today's learned words or currently selected words)
  const displayWordIds =
    todaySession.phase === 'completed'
      ? todayHist?.learnedIds || todaySession.masteredWordIds
      : todaySession.selectedWordIds;

  const displayWords = displayWordIds
    .map((id) => WORD_BY_ID.get(id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const renderHeroAction = () => {
    switch (todaySession.phase) {
      case 'triage': {
        const remaining = Math.max(0, todaySession.targetCount - todaySession.selectedWordIds.length);
        const started = todaySession.selectedWordIds.length > 0;
        return {
          badge: started ? '1. Aşama • Devam Ediyor' : '1. Aşama • Günlük Keşif',
          title: started
            ? `${remaining} kelime daha seç`
            : `Bugünün ${todaySession.targetCount} kelimesini seç`,
          desc: started
            ? 'Bilmediğin kelimeleri sola kaydırmaya devam et, hedefin dolunca öğrenmeye geçelim.'
            : 'Bilmediklerini sola, bildiklerini sağa kaydır. Seçtiğin kelimeleri hemen öğretelim!',
          cta: started ? 'Seçime Devam Et' : 'Kelime Seçmeye Başla',
          icon: <Layers className="h-4 w-4" />,
          onClick: () => setOverlay({ type: 'triage' }),
        };
      }
      case 'ready':
        return {
          badge: '2. Aşama • Öğrenmeye Hazır',
          title: `${todaySelectedWords.length} kelimen hazır!`,
          desc: 'Seçtiğin kelimeleri sesli telaffuz, Türkçe anlam ve örnek cümle kartlarıyla öğren.',
          cta: 'Kartlarla Öğrenmeye Başla',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: () => startStudyFromReady(),
        };
      case 'study':
        return {
          badge: '2. Aşama • Aktif Öğrenme',
          title: 'Kelime kartlarına devam et',
          desc: `Bugün seçtiğin ${todaySelectedWords.length} kelimeyi kartlarla pekiştirmeye devam et.`,
          cta: 'Öğrenmeye Devam Et',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: () => setOverlay({ type: 'study' }),
        };
      case 'quiz':
        return {
          badge: 'Son Adım • Pekiştirme',
          title: 'Hızlı testi tamamla',
          desc: 'Çalıştığın kelimeleri 1 dakikalık testle kalıcı hafızaya kaydet!',
          cta: 'Pekiştirme Testini Başlat',
          icon: <Sparkles className="h-4 w-4" />,
          onClick: () => setOverlay({ type: 'quiz' }),
        };
      case 'completed':
        return {
          badge: 'Bugünün Hedefi Tamamlandı',
          title: 'Harika gidiyorsun!',
          desc: `Bugün ${todayLearnedCount} yeni kelime öğrendin. İstersen ekstra yeni bir paket daha çalışabilirsin.`,
          cta: `Ekstra +${state.settings.dailyGoal} Kelime Çalış`,
          icon: <Plus className="h-4 w-4" />,
          onClick: () => startExtraBatch(),
        };
    }
  };

  const hero = renderHeroAction();

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Top Greeting Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">
              {formatTurkishDate(todayKey)}
            </span>
            {state.simulatedDayOffset !== 0 && (
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-[#BFDBFE]">
                {state.simulatedDayOffset > 0
                  ? `+${state.simulatedDayOffset} Gün Test`
                  : `${state.simulatedDayOffset} Gün Test`}
              </span>
            )}
          </div>
          <h1 className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-[#0F172A]">
            Merhaba{greetingName}
          </h1>
        </div>

        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-soft border border-[#E2ECF9]">
          <Flame
            className={`h-4 w-4 ${streak > 0 ? 'text-[#2563EB] fill-[#BFDBFE]' : 'text-[#94A3B8]'}`}
          />
          <div className="leading-none">
            <div className="text-xs font-extrabold text-[#0F172A]">{streak} Gün</div>
            <div className="text-[9px] font-semibold text-[#94A3B8]">Seri</div>
          </div>
        </div>
      </div>

      {/* Hero Daily Mission Card */}
      <motion.div
        layout
        className={`relative overflow-hidden rounded-[26px] p-5 shadow-card border ${
          todaySession.phase === 'completed'
            ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white border-[#1D4ED8]'
            : 'bg-white text-[#0F172A] border-[#DCE7F7]'
        }`}
      >
        {/* Soft decorative circle */}
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${
            todaySession.phase === 'completed' ? 'bg-white/10' : 'bg-[#EFF6FF]'
          }`}
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                todaySession.phase === 'completed'
                  ? 'bg-white/15 text-white'
                  : 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]'
              }`}
            >
              {todaySession.phase === 'completed' && <CheckCircle2 className="h-3 w-3" />}
              {hero.badge}
            </span>
            <h2
              className={`mt-2.5 font-display text-lg font-extrabold leading-snug ${
                todaySession.phase === 'completed' ? 'text-white' : 'text-[#0F172A]'
              }`}
            >
              {hero.title}
            </h2>
            <p
              className={`mt-1 text-xs leading-relaxed ${
                todaySession.phase === 'completed' ? 'text-[#DBEAFE]' : 'text-[#64748B]'
              }`}
            >
              {hero.desc}
            </p>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke={todaySession.phase === 'completed' ? 'rgba(255,255,255,0.22)' : '#E8F0FE'}
                strokeWidth="7"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke={todaySession.phase === 'completed' ? '#FFFFFF' : '#2563EB'}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={`font-display text-sm font-extrabold leading-none ${
                  todaySession.phase === 'completed' ? 'text-white' : 'text-[#1E40AF]'
                }`}
              >
                {ringLabel}
              </span>
              <span
                className={`mt-0.5 text-[9px] font-semibold ${
                  todaySession.phase === 'completed' ? 'text-[#DBEAFE]' : 'text-[#64748B]'
                }`}
              >
                {ringSub}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Primary CTA */}
        <button
          type="button"
          onClick={hero.onClick}
          className={`relative mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.98] ${
            todaySession.phase === 'completed'
              ? 'bg-white text-[#1D4ED8] shadow-soft hover:bg-[#F8FAFF]'
              : 'bg-[#2563EB] text-white shadow-soft hover:bg-[#1D4ED8]'
          }`}
        >
          {hero.icon}
          {hero.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Spaced Repetition Review Card (appears on Day 2+ when words are due!) */}
      {dueReviewWords.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#EFF6FF] p-4 border border-[#BFDBFE] shadow-soft">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-soft">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#0F172A]">
                Tekrar Zamanı ({dueReviewWords.length} kelime)
              </div>
              <div className="text-[11px] text-[#475569] truncate">
                Önceki günlerden öğrendiklerini tazele
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOverlay({ type: 'review' })}
            className="shrink-0 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1D4ED8] active:scale-95 transition"
          >
            Tekrar Et
          </button>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9] text-center">
          <div className="font-display text-lg font-extrabold text-[#2563EB]">
            {totals.learnedCount}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B]">Öğrenilen</div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9] text-center">
          <div className="font-display text-lg font-extrabold text-[#0D9488]">
            {totals.knownCount}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B]">Bildiğin</div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9] text-center">
          <div className="font-display text-lg font-extrabold text-[#334155]">
            {Math.max(0, totals.totalWords - totals.masteredOrKnownCount)}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B]">Kalan</div>
        </div>
      </div>

      {/* 7-Day Activity Calendar Strip */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A]">Son 7 Gün</span>
          <span className="text-[11px] font-medium text-[#64748B]">
            Bugün: {todayLearnedCount} öğrenilen · {todayKnownCount} bilinen
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {last7Keys.map((dk) => {
            const hist = state.history[dk];
            const isToday = dk === todayKey;
            const done = Boolean(hist && (hist.completed || hist.learnedIds.length > 0));
            return (
              <div key={dk} className="flex flex-col items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold ${
                    isToday ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                  }`}
                >
                  {getShortDayName(dk)}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                    done
                      ? 'bg-[#2563EB] text-white shadow-soft'
                      : isToday
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-2 border-[#93C5FD]'
                        : 'bg-[#F8FAFC] text-[#CBD5E1] border border-[#EDF2F7]'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : dk.slice(-2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Words Preview List */}
      {displayWords.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A]">
              {todaySession.phase === 'completed'
                ? `Bugün Öğrendiğin Kelimeler (${displayWords.length})`
                : `Bugün Seçilen Kelimeler (${displayWords.length})`}
            </h3>
            {todaySession.phase === 'completed' && (
              <button
                type="button"
                onClick={() => setOverlay({ type: 'study' })}
                className="text-[11px] font-bold text-[#2563EB] hover:underline"
              >
                Tekrar Göz At
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar pr-0.5">
            {displayWords.map((w) => {
              const meta = CEFR_META[w.lvl];
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#F8FAFF] px-3 py-2.5 border border-[#EAF1FB]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#0F172A] truncate">{w.w}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${meta.bg} ${meta.text}`}
                      >
                        {w.lvl}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] truncate">{w.tr}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(w.w, state.settings.accent, state.settings.speechRate)
                    }
                    aria-label={`${w.w} dinle`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] border border-[#DCE7F7] hover:bg-[#EFF6FF] active:scale-95 transition"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
