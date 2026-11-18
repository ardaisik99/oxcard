import React, { useState } from 'react';
import {
  BookCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flame,
  GraduationCap,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, WORD_BY_ID } from '../data/words';
import {
  formatShortTurkishDate,
  formatTurkishDate,
  getLast7DateKeys,
  getShortDayName,
} from '../utils/dates';
import { speakEnglish } from '../utils/speech';
import type { CEFRLevel } from '../types';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];

export const StatsTab: React.FC = () => {
  const { state, todayKey, streak, totals } = useAppStore();
  const [expandedDate, setExpandedDate] = useState<string | null>(todayKey);

  const learnedPct = (totals.learnedCount / Math.max(1, totals.totalWords)) * 100;
  const knownPct = (totals.knownCount / Math.max(1, totals.totalWords)) * 100;
  const totalPct = Math.min(100, Math.round(learnedPct + knownPct));

  const last7 = getLast7DateKeys(todayKey);
  const dailyCounts = last7.map((dk) => ({
    date: dk,
    day: getShortDayName(dk),
    learned: state.history[dk]?.learnedIds.length || 0,
    known: state.history[dk]?.knownIds.length || 0,
  }));
  const maxBar = Math.max(state.settings.dailyGoal, ...dailyCounts.map((d) => d.learned), 10);

  const historyList = Object.values(state.history)
    .filter((h) => h.learnedIds.length > 0 || h.knownIds.length > 0 || h.reviewedIds.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div>
        <h1 className="font-display text-lg font-extrabold text-[#0F172A]">
          İlerleme ve İstatistikler
        </h1>
        <p className="text-[11px] font-medium text-[#64748B]">
          Oxford 3000 yolculuğundaki tüm gelişimin
        </p>
      </div>

      {/* Overall Oxford 3000 Mastery Card */}
      <div className="rounded-[26px] bg-white p-5 shadow-card border border-[#DCE7F7]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#64748B]">Oxford 3000 Hakimiyeti</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-extrabold text-[#0F172A]">
                {totals.masteredOrKnownCount.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-semibold text-[#94A3B8]">
                / {totals.totalWords.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] font-display text-sm font-extrabold text-[#2563EB] border border-[#DBEAFE]">
            %{totalPct}
          </div>
        </div>

        {/* Two-tone Segmented Progress Bar */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-[#EFF6FF]">
          <div
            style={{ width: `${learnedPct}%` }}
            className="h-full bg-[#2563EB] transition-all duration-500"
          />
          <div
            style={{ width: `${knownPct}%` }}
            className="h-full bg-[#0D9488] transition-all duration-500"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#1E40AF]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
              Öğrenilen ({totals.learnedCount})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#0F766E]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
              Bilinen ({totals.knownCount})
            </span>
          </div>
        </div>
      </div>

      {/* 3 Mini Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E6EEF9]">
          <Flame className="h-4.5 w-4.5 text-[#2563EB] mb-1.5" />
          <div className="font-display text-xl font-extrabold text-[#0F172A]">{streak}</div>
          <div className="text-[10px] font-semibold text-[#64748B]">Günlük Seri</div>
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E6EEF9]">
          <GraduationCap className="h-4.5 w-4.5 text-[#0284C7] mb-1.5" />
          <div className="font-display text-xl font-extrabold text-[#0F172A]">
            {historyList.length}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B]">Aktif Gün</div>
        </div>

        <div className="rounded-2xl bg-white p-3.5 shadow-soft border border-[#E6EEF9]">
          <BookCheck className="h-4.5 w-4.5 text-[#0D9488] mb-1.5" />
          <div className="font-display text-xl font-extrabold text-[#0F172A]">
            {totals.favoriteCount}
          </div>
          <div className="text-[10px] font-semibold text-[#64748B]">Favori</div>
        </div>
      </div>

      {/* 7-Day Learning Chart */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A]">Son 7 Gün Öğrenilen</span>
          <span className="text-[11px] font-medium text-[#64748B]">
            Hedef: {state.settings.dailyGoal}/gün
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-28 pt-3">
          {dailyCounts.map((item) => {
            const pct = Math.round((item.learned / maxBar) * 100);
            const isToday = item.date === todayKey;
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center h-full justify-end">
                <span className="mb-1 text-[10px] font-bold text-[#2563EB] min-h-[14px]">
                  {item.learned > 0 ? item.learned : ''}
                </span>
                <div className="w-full max-w-[26px] flex-1 flex items-end rounded-t-lg bg-[#F1F6FE] overflow-hidden">
                  <div
                    style={{ height: `${Math.max(item.learned > 0 ? 12 : 4, pct)}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      item.learned > 0
                        ? isToday
                          ? 'bg-[#2563EB]'
                          : 'bg-[#60A5FA]'
                        : 'bg-[#E2ECF9]'
                    }`}
                  />
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-semibold ${
                    isToday ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CEFR Level Breakdown */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <h3 className="text-xs font-bold text-[#0F172A] mb-3">Seviye Bazlı İlerleme (CEFR)</h3>
        <div className="space-y-3">
          {LEVELS.map((lvl) => {
            const data = totals.byLevel[lvl];
            const meta = CEFR_META[lvl];
            const done = data.learned + data.known;
            const pct = Math.round((done / Math.max(1, data.total)) * 100);
            return (
              <div key={lvl}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#0F172A]">{meta.label}</span>
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    {done} / {data.total} <span className="text-[#2563EB]">(%{pct})</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFF6FF]">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily History Log */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-[#2563EB]" />
          <h3 className="text-xs font-bold text-[#0F172A]">Günlük Öğrenme Geçmişi</h3>
        </div>

        {historyList.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#94A3B8]">
            Henüz tamamlanmış bir gün yok. İlk kelime paketini tamamladığında burada görünecek!
          </p>
        ) : (
          <div className="space-y-2">
            {historyList.map((entry) => {
              const isOpen = expandedDate === entry.date;
              const learnedWords = entry.learnedIds
                .map((id) => WORD_BY_ID.get(id))
                .filter((w): w is NonNullable<typeof w> => Boolean(w));

              return (
                <div
                  key={entry.date}
                  className="rounded-xl border border-[#EAF1FB] bg-[#F9FBFF] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isOpen ? null : entry.date)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        {entry.date === todayKey
                          ? `Bugün (${formatShortTurkishDate(entry.date)})`
                          : formatTurkishDate(entry.date)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#64748B]">
                        <span className="font-semibold text-[#2563EB]">
                          {entry.learnedIds.length} öğrenilen
                        </span>
                        {' · '}
                        <span>{entry.knownIds.length} bilinen</span>
                        {entry.reviewedIds.length > 0 && (
                          <>
                            {' · '}
                            <span>{entry.reviewedIds.length} tekrar</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#64748B]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#64748B]" />
                    )}
                  </button>

                  {isOpen && learnedWords.length > 0 && (
                    <div className="border-t border-[#EAF1FB] bg-white px-3 py-2 space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                      {learnedWords.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-[#0F172A]">{w.w}</span>
                            <span className="mx-1.5 text-[#CBD5E1]">—</span>
                            <span className="text-[#64748B]">{w.tr}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              speakEnglish(w.w, state.settings.accent, state.settings.speechRate)
                            }
                            className="text-[#2563EB] hover:text-[#1D4ED8] p-1"
                            aria-label={`${w.w} dinle`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
