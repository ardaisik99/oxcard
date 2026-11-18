import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Plus,
  Search,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CEFR_META, OXFORD_WORDS, getPosTurkish } from '../data/words';
import { speakEnglish } from '../utils/speech';
import type { CEFRLevel, WordItem, WordStatus } from '../types';

type StatusFilter = 'ALL' | 'learned' | 'known' | 'new' | 'favorite';

export const DictionaryTab: React.FC = () => {
  const {
    state,
    toggleFavorite,
    setWordStatusManual,
    addWordToTodaySelection,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | CEFRLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [visibleCount, setVisibleCount] = useState(50);
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OXFORD_WORDS.filter((w) => {
      if (levelFilter !== 'ALL' && w.lvl !== levelFilter) return false;
      const prog = state.wordProgress[w.id];
      const st: WordStatus = prog?.status || 'new';
      if (statusFilter === 'learned' && st !== 'learned') return false;
      if (statusFilter === 'known' && st !== 'known') return false;
      if (statusFilter === 'new' && st !== 'new') return false;
      if (statusFilter === 'favorite' && !prog?.favorite) return false;
      if (q) {
        return w.w.toLowerCase().includes(q) || w.tr.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, levelFilter, statusFilter, state.wordProgress]);

  const shown = filtered.slice(0, visibleCount);

  const getStatusBadge = (wordId: number) => {
    const st = state.wordProgress[wordId]?.status || 'new';
    if (st === 'learned') {
      return (
        <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
          Öğrenildi
        </span>
      );
    }
    if (st === 'known') {
      return (
        <span className="rounded-full bg-[#F0FDFA] px-2 py-0.5 text-[10px] font-bold text-[#0D9488]">
          Biliyorum
        </span>
      );
    }
    if (st === 'learning') {
      return (
        <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#B45309]">
          Bugün
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Sticky Search & Filters */}
      <div className="shrink-0 z-10 bg-[#F7FAFF]/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-[#E6EEF9]">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="font-display text-lg font-extrabold text-[#0F172A]">
              Oxford 3000 Sözlük
            </h1>
            <p className="text-[11px] font-medium text-[#64748B]">
              {filtered.length.toLocaleString('tr-TR')} kelime listeleniyor
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(50);
            }}
            placeholder="İngilizce veya Türkçe ara..."
            className="w-full rounded-2xl bg-white border border-[#DCE7F7] pl-10 pr-9 py-2.5 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none shadow-soft transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* CEFR Filter Row */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevelFilter(lvl);
                setVisibleCount(50);
              }}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                levelFilter === lvl
                  ? 'bg-[#2563EB] text-white shadow-soft'
                  : 'bg-white text-[#475569] border border-[#E2ECF9] hover:bg-[#EFF6FF]'
              }`}
            >
              {lvl === 'ALL' ? 'Tüm Seviyeler' : lvl}
            </button>
          ))}
        </div>

        {/* Status Filter Row */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'ALL', label: 'Hepsi' },
              { id: 'learned', label: 'Öğrenildi' },
              { id: 'known', label: 'Bildiklerim' },
              { id: 'new', label: 'Yeni' },
              { id: 'favorite', label: 'Favoriler ★' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatusFilter(f.id);
                setVisibleCount(50);
              }}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                statusFilter === f.id
                  ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                  : 'bg-transparent text-[#64748B] hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-2 pb-8">
        {shown.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-[#E6EEF9]">
            <p className="text-sm font-bold text-[#334155]">Sonuç bulunamadı</p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Farklı bir arama kelimesi veya filtre deneyebilirsin.
            </p>
          </div>
        ) : (
          <>
            {shown.map((w) => {
              const meta = CEFR_META[w.lvl];
              const isFav = Boolean(state.wordProgress[w.id]?.favorite);
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWord(w)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedWord(w);
                  }}
                  className="flex items-center justify-between gap-2.5 rounded-2xl bg-white p-3.5 shadow-soft border border-[#E6EEF9] hover:border-[#BFDBFE] active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display text-sm font-extrabold text-[#0F172A]">
                        {w.w}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.text}`}
                      >
                        {w.lvl}
                      </span>
                      {getStatusBadge(w.id)}
                      {isFav && <Star className="h-3.5 w-3.5 text-[#2563EB] fill-[#2563EB]" />}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-[#64748B] truncate">
                      {w.tr}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(w.w, state.settings.accent, state.settings.speechRate);
                    }}
                    aria-label={`${w.w} telaffuz`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F8FF] text-[#2563EB] hover:bg-[#DBEAFE] transition"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {visibleCount < filtered.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + 60)}
                className="mt-2 w-full rounded-2xl bg-white py-3 text-xs font-bold text-[#2563EB] border border-[#DCE7F7] shadow-soft hover:bg-[#EFF6FF] transition"
              >
                Daha Fazla Göster ({filtered.length - visibleCount} kelime kaldı)
              </button>
            )}
          </>
        )}
      </div>

      {/* Word Detail Bottom Sheet Modal */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedWord(null)}
            className="absolute inset-0 z-50 flex items-end justify-center bg-[#0F172A]/35 backdrop-blur-[2px] p-2.5"
          >
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[390px] max-h-[82%] overflow-y-auto no-scrollbar rounded-[28px] bg-white p-5 shadow-card border border-[#DCE7F7]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${CEFR_META[selectedWord.lvl].bg} ${CEFR_META[selectedWord.lvl].text} ${CEFR_META[selectedWord.lvl].border}`}
                    >
                      {CEFR_META[selectedWord.lvl].label}
                    </span>
                    <span className="rounded-full bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
                      {getPosTurkish(selectedWord.pos)}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-[#0F172A]">
                    {selectedWord.w}
                  </h2>
                  <p className="text-base font-bold text-[#2563EB] mt-0.5">{selectedWord.tr}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedWord.id)}
                    aria-label="Favori"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      state.wordProgress[selectedWord.id]?.favorite
                        ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        state.wordProgress[selectedWord.id]?.favorite ? 'fill-[#2563EB]' : ''
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWord(null)}
                    aria-label="Kapat"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Audio Buttons */}
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(selectedWord.w, state.settings.accent, state.settings.speechRate)
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-bold text-[#2563EB] border border-[#DBEAFE]"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Telaffuz Dinle
                </button>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedWord.w, state.settings.accent, 0.65)}
                  className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#64748B] border border-[#E2E8F0]"
                >
                  Yavaş
                </button>
              </div>

              {/* Definition */}
              <div className="mt-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  İngilizce Tanım
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#334155]">{selectedWord.def}</p>
              </div>

              {/* Example */}
              <div className="mt-3.5 rounded-2xl bg-[#F4F8FF] p-3.5 border border-[#E2ECF9]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Örnek Cümle
                  </span>
                  <button
                    type="button"
                    onClick={() => speakEnglish(selectedWord.ex, state.settings.accent, 0.92)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-[#DBEAFE]"
                  >
                    <Volume2 className="h-3 w-3" />
                    Dinle
                  </button>
                </div>
                <p className="text-xs font-medium leading-relaxed text-[#0F172A]">
                  &ldquo;{selectedWord.ex}&rdquo;
                </p>
              </div>

              {/* Collocations & Synonyms */}
              {selectedWord.col && selectedWord.col.length > 0 && (
                <div className="mt-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Sık Kullanılan Kalıplar
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWord.col.map((c) => (
                      <span
                        key={c}
                        className="rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1E40AF]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.syn && selectedWord.syn.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Eş Anlamlılar
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWord.syn.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-medium text-[#475569]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Toast Feedback */}
              {toastMsg && (
                <div className="mt-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-2 text-center text-xs font-bold text-[#1D4ED8]">
                  {toastMsg}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = addWordToTodaySelection(selectedWord.id);
                    showToast(res.message);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-[#2563EB] py-3 text-xs font-bold text-white shadow-soft hover:bg-[#1D4ED8] transition"
                >
                  <Plus className="h-4 w-4" />
                  Bugünkü Çalışma Listeme Ekle
                </button>

                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { st: 'new', label: 'Yeni' },
                      { st: 'known', label: 'Biliyorum' },
                      { st: 'learned', label: 'Öğrendim' },
                    ] as const
                  ).map((item) => {
                    const active =
                      (state.wordProgress[selectedWord.id]?.status || 'new') === item.st;
                    return (
                      <button
                        key={item.st}
                        type="button"
                        onClick={() => {
                          setWordStatusManual(selectedWord.id, item.st);
                          showToast(`Durum "${item.label}" olarak güncellendi`);
                        }}
                        className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold border transition ${
                          active
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1D4ED8]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
