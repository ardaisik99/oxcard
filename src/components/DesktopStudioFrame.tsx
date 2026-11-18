import React, { useState } from 'react';
import {
  CalendarPlus,
  ChevronLeft,
  Keyboard,
  Maximize2,
  RotateCcw,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { BrandLogo } from './BrandMark';
import { useAppStore } from '../store/useAppStore';
import { formatTurkishDate } from '../utils/dates';

interface ShortcutItem {
  keys: string[];
  label: string;
}

export const DesktopStudioFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    todayKey,
    overlay,
    totals,
    dueReviewWords,
    advanceSimulatedDay,
    resetSimulatedDay,
    updateSettings,
  } = useAppStore();

  const [wideMode, setWideMode] = useState(false);

  const getShortcuts = (): { title: string; items: ShortcutItem[] } => {
    if (overlay.type === 'triage') {
      return {
        title: 'Keşif & Seçim Kısayolları',
        items: [
          { keys: ['←'], label: 'Bilmiyorum (Öğrenmeye ekle)' },
          { keys: ['→'], label: 'Biliyorum (Geç)' },
          { keys: ['Boşluk'], label: 'Anlamına göz at' },
          { keys: ['S'], label: 'Sesli telaffuz dinle' },
          { keys: ['Z'], label: 'Son seçimi geri al' },
        ],
      };
    }
    if (overlay.type === 'study' || overlay.type === 'review') {
      return {
        title: 'Kart Çalışma Kısayolları',
        items: [
          { keys: ['Boşluk'], label: 'Kartı çevir' },
          { keys: ['←', '1'], label: 'Tekrar göster / Unuttum' },
          { keys: ['→', '2'], label: 'Öğrendim / Hatırladım' },
          { keys: ['S'], label: 'Sesli telaffuz dinle' },
          { keys: ['Esc'], label: 'Oturumu kapat' },
        ],
      };
    }
    if (overlay.type === 'quiz') {
      return {
        title: 'Test Kısayolları',
        items: [
          { keys: ['1–4'], label: 'Şık seç (1, 2, 3, 4)' },
          { keys: ['S'], label: 'Kelimeyi dinle' },
          { keys: ['Esc'], label: 'Testten çık' },
        ],
      };
    }
    return {
      title: 'PC Kontrol İpuçları',
      items: [
        { keys: ['Sürükle'], label: 'Kartları fareyle sola/sağa kaydır' },
        { keys: ['←', '→'], label: 'Kart seçiminde yön tuşlarını kullan' },
        { keys: ['Boşluk'], label: 'Kartları çevir / ipucu aç' },
        { keys: ['S'], label: 'İngilizce telaffuzu dinle' },
      ],
    };
  };

  const shortcuts = getShortcuts();

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#EAF2FC] via-[#F4F8FF] to-[#E6EFFB] md:flex md:items-center md:justify-center md:p-5 lg:p-6">
      <div className="w-full md:flex md:items-center md:justify-center md:gap-7 max-w-[1060px]">
        {/* Mobile App Viewport (Full screen on mobile, Phone Shell on desktop) */}
        <div
          className={`relative w-full h-[100dvh] bg-[#F7FAFF] overflow-hidden flex flex-col transition-all duration-300 ${
            wideMode
              ? 'md:w-[540px] md:h-[90vh] md:max-h-[860px] md:rounded-[34px] md:shadow-phone md:border-[6px] md:border-white'
              : 'md:w-[402px] md:h-[812px] md:max-h-[92vh] md:rounded-[44px] md:shadow-phone md:border-[10px] md:border-[#1E293B]'
          }`}
        >
          {/* Subtle Phone Status Bar (visible on desktop phone frame only) */}
          {!wideMode && (
            <div className="hidden md:flex items-center justify-between px-6 pt-2.5 pb-1.5 bg-[#F7FAFF] text-[11px] font-bold text-[#334155] shrink-0 select-none">
              <span>09:41</span>
              <div className="h-5 w-24 rounded-full bg-[#0F172A]/90" />
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                <span>OxCard</span>
                <span className="h-2 w-4 rounded-sm border border-[#64748B] p-[1px] inline-flex items-center">
                  <span className="h-full w-full rounded-[1px] bg-[#2563EB]" />
                </span>
              </div>
            </div>
          )}

          {/* Actual Mobile App Root */}
          <div className="relative flex-1 overflow-hidden flex flex-col">{children}</div>

          {/* Subtle Home Indicator (phone frame desktop only) */}
          {!wideMode && (
            <div className="hidden md:flex items-center justify-center py-1.5 bg-white shrink-0">
              <div className="h-1 w-28 rounded-full bg-[#CBD5E1]" />
            </div>
          )}
        </div>

        {/* Desktop PC Companion Control Panel (Hidden on phones, visible on laptops/PCs) */}
        <aside className="hidden lg:flex w-[328px] shrink-0 flex-col gap-3.5">
          {/* Brand Summary Card */}
          <div className="rounded-[24px] bg-white/95 backdrop-blur p-4 shadow-card border border-[#DCE7F7]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandLogo size={42} />
                <div>
                  <h2 className="font-display text-base font-extrabold text-[#0F172A] leading-tight">
                    OxCard
                  </h2>
                  <p className="text-[11px] font-medium text-[#64748B]">
                    PC Kontrol & Mobil Önizleme
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWideMode((w) => !w)}
                title={wideMode ? 'Telefon görünümüne geç' : 'Geniş görünüme geç'}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] hover:bg-[#DBEAFE] transition"
              >
                {wideMode ? <Smartphone className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[#F4F8FF] p-2 border border-[#E6EEF9]">
                <div className="font-display text-sm font-extrabold text-[#2563EB]">
                  {totals.totalWords.toLocaleString('tr-TR')}
                </div>
                <div className="text-[10px] font-semibold text-[#64748B]">Oxford</div>
              </div>
              <div className="rounded-xl bg-[#F4F8FF] p-2 border border-[#E6EEF9]">
                <div className="font-display text-sm font-extrabold text-[#0F172A]">
                  {totals.learnedCount}
                </div>
                <div className="text-[10px] font-semibold text-[#64748B]">Öğrenilen</div>
              </div>
              <div className="rounded-xl bg-[#F4F8FF] p-2 border border-[#E6EEF9]">
                <div className="font-display text-sm font-extrabold text-[#0D9488]">
                  {dueReviewWords.length}
                </div>
                <div className="text-[10px] font-semibold text-[#64748B]">Tekrar</div>
              </div>
            </div>
          </div>

          {/* Live Keyboard Shortcuts Card */}
          <div className="rounded-[24px] bg-white/95 backdrop-blur p-4 shadow-soft border border-[#DCE7F7]">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                <Keyboard className="h-4 w-4" />
              </div>
              <span className="text-xs font-extrabold text-[#0F172A]">{shortcuts.title}</span>
            </div>

            <div className="space-y-2">
              {shortcuts.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#475569] font-medium">{item.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-lg bg-[#F4F8FF] border border-[#CBD5E1] px-2 py-0.5 font-mono text-[11px] font-bold text-[#1E3A8A] shadow-[0_1px_0_#CBD5E1]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day Simulation Card (Super handy on PC for testing multi-day workflow!) */}
          <div className="rounded-[24px] bg-white/95 backdrop-blur p-4 shadow-soft border border-[#DCE7F7]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <CalendarPlus className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-[#0F172A]">Gün Simülasyonu</span>
              </div>
              {state.simulatedDayOffset !== 0 && (
                <button
                  type="button"
                  onClick={resetSimulatedDay}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#EFF6FF] px-2 py-1 text-[10px] font-bold text-[#2563EB] hover:bg-[#DBEAFE]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Bugüne Dön
                </button>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-[#64748B] mb-3">
              Aktif tarih: <strong className="text-[#0F172A]">{formatTurkishDate(todayKey)}</strong>.
              Ertesi gün yeni kelimelerin ve tekrarların nasıl açıldığını hemen test edebilirsin.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => advanceSimulatedDay(-1)}
                title="1 gün geri"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => advanceSimulatedDay(1)}
                className="flex-1 rounded-xl bg-[#2563EB] py-2 px-3 text-xs font-bold text-white shadow-soft hover:bg-[#1D4ED8] active:scale-[0.98] transition"
              >
                Ertesi Güne Geç (+1 Gün)
              </button>
            </div>
          </div>

          {/* Quick Audio Accent Switch */}
          <div className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-soft border border-[#DCE7F7]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#334155]">
              <Volume2 className="h-4 w-4 text-[#2563EB]" />
              Aksan
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-[#F4F8FF] p-1 border border-[#E2ECF9]">
              {(
                [
                  { id: 'en-US', label: 'US' },
                  { id: 'en-GB', label: 'UK' },
                ] as const
              ).map((ac) => (
                <button
                  key={ac.id}
                  type="button"
                  onClick={() => updateSettings({ accent: ac.id })}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    state.settings.accent === ac.id
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {ac.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
