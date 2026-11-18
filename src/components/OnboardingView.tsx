import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from './BrandMark';
import { useAppStore } from '../store/useAppStore';
import type { LevelFilterPref } from '../types';

const PRESET_GOALS = [5, 10, 15, 20, 30];

const LEVEL_OPTIONS: Array<{ value: LevelFilterPref; title: string; subtitle: string; badge: string }> = [
  {
    value: 'ALL',
    title: "A1'den Başla (Önerilen)",
    subtitle: 'En temel kelimelerden ileri seviyeye düzenli akış',
    badge: 'A1–B2',
  },
  {
    value: 'A2',
    title: 'Temel Seviye (A2+)',
    subtitle: 'Çok temel kelimeleri biliyorum, A2 ile başlayalım',
    badge: 'A2+',
  },
  {
    value: 'B1',
    title: 'Orta Seviye (B1+)',
    subtitle: 'Günlük İngilizceyi anlıyorum, kelime dağarcığımı büyüteyim',
    badge: 'B1+',
  },
  {
    value: 'B2',
    title: 'Üst Orta (B2)',
    subtitle: 'Akademik, iş ve ileri seviye Oxford kelimeleri',
    badge: 'B2',
  },
];

export const OnboardingView: React.FC = () => {
  const { completeOnboarding, totals } = useAppStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(20);
  const [startLevel, setStartLevel] = useState<LevelFilterPref>('ALL');

  const estimatedMinutes = Math.max(2, Math.round(dailyGoal * 0.35));
  const estimatedDays = Math.ceil(totals.totalWords / dailyGoal);

  const handleFinish = () => {
    completeOnboarding({ dailyGoal, startLevel, userName });
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4F8FF] via-[#F9FBFF] to-white px-5 pt-4 pb-5">
      {/* Top step indicator */}
      <div className="mb-3 flex items-center justify-between">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] shadow-soft border border-[#E2ECF9] hover:bg-[#F8FAFC] active:scale-95 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Geri
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold text-[#2563EB] border border-[#DBEAFE]">
            <Sparkles className="h-3 w-3" />
            Oxford 3000
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 1 ? 'w-6 bg-[#2563EB]' : 'w-2 bg-[#BFDBFE]'
            }`}
          />
          <span
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 2 ? 'w-6 bg-[#2563EB]' : 'w-2 bg-[#BFDBFE]'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col"
            >
              <div className="mb-3.5 flex flex-col items-center text-center">
                <div className="mb-2.5 rounded-[22px] p-1 bg-white shadow-card border border-[#E5EEFA]">
                  <BrandLogo size={54} />
                </div>
                <h1 className="font-display text-[22px] font-extrabold tracking-tight text-[#0F172A]">
                  OxCard&apos;a Hoş Geldin
                </h1>
                <p className="mt-1 max-w-[290px] text-xs leading-relaxed text-[#64748B]">
                  Oxford&apos;un en sık kullanılan <strong className="font-semibold text-[#1E40AF]">{totals.totalWords.toLocaleString('tr-TR')}</strong> İngilizce kelimesini her gün kolayca öğren.
                </p>
              </div>

              {/* How it works cards */}
              <div className="space-y-2 mb-3.5">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#0F172A]">1. Kaydır ve Seç</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
                      Bildiklerini sağa, bilmediklerini sola kaydır. Hedefine ulaşınca günlük paket hazır!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#0F172A]">2. Kartlarla Öğren</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
                      Seçtiğin kelimeleri Türkçe anlamı, sesli telaffuzu, örnek cümlesi ve mini testiyle öğren.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0D9488]">
                    <CalendarCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-[#0F172A]">3. Her Gün Yeni Kelimeler</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#64748B]">
                      Tüm ilerlemen kaydedilir. Ertesi gün yeni kelimeler gelir, eskiler zamanında tekrar edilir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Name Input */}
              <div className="rounded-2xl bg-white p-3 shadow-soft border border-[#E6EEF9]">
                <label
                  htmlFor="ox-user-name"
                  className="block text-[11px] font-semibold text-[#475569] mb-1.5"
                >
                  Sana nasıl hitap edelim? <span className="font-normal text-[#94A3B8]">(İsteğe bağlı)</span>
                </label>
                <input
                  id="ox-user-name"
                  type="text"
                  maxLength={24}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Örn: Arda"
                  className="w-full rounded-xl bg-[#F8FAFF] border border-[#DCE7F7] px-3 py-2 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none transition"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col"
            >
              <div className="mb-4 text-center">
                <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                  Günlük Hedefini Belirle
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Her gün kaç bilmediğin yeni kelime öğrenmek istersin?
                </p>
              </div>

              {/* Goal Hero Card */}
              <div className="rounded-3xl bg-white p-5 shadow-card border border-[#E2ECF9] mb-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-extrabold tracking-tight text-[#2563EB]">
                      {dailyGoal}
                    </span>
                    <span className="text-sm font-semibold text-[#64748B]">kelime / gün</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#64748B]">
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-[#1D4ED8] font-semibold">
                      ~{estimatedMinutes} dk/gün
                    </span>
                    <span>•</span>
                    <span>Tüm liste ~{estimatedDays} gün</span>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="mt-4 grid grid-cols-5 gap-1.5">
                  {PRESET_GOALS.map((val) => {
                    const active = dailyGoal === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDailyGoal(val)}
                        className={`relative rounded-xl py-2 text-sm font-bold transition ${
                          active
                            ? 'bg-[#2563EB] text-white shadow-soft'
                            : 'bg-[#F4F8FF] text-[#334155] hover:bg-[#E8F1FF]'
                        }`}
                      >
                        {val}
                        {val === 20 && (
                          <span
                            className={`block text-[9px] font-semibold leading-none mt-0.5 ${
                              active ? 'text-[#DBEAFE]' : 'text-[#2563EB]'
                            }`}
                          >
                            Önerilen
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Fine Slider */}
                <div className="mt-4">
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="ox-slider w-full"
                    aria-label="Günlük kelime hedefi"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-medium text-[#94A3B8]">
                    <span>5 (Rahat)</span>
                    <span>20 (İdeal)</span>
                    <span>50 (Yoğun)</span>
                  </div>
                </div>
              </div>

              {/* Level Preference */}
              <div className="mb-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B] px-1">
                  Başlangıç Seviyesi
                </p>
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map((opt) => {
                    const active = startLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStartLevel(opt.value)}
                        className={`w-full flex items-center justify-between rounded-2xl p-3 text-left transition border ${
                          active
                            ? 'bg-[#EFF6FF] border-[#2563EB] shadow-soft'
                            : 'bg-white border-[#E6EEF9] hover:border-[#BFDBFE]'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="text-[13px] font-bold text-[#0F172A]">{opt.title}</div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{opt.subtitle}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                            active
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Primary CTA */}
      <div className="pt-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
          >
            Hedefini Seç
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] py-3.5 text-sm font-bold text-white shadow-card hover:bg-[#1D4ED8] active:scale-[0.98] transition"
          >
            Günlük {dailyGoal} Kelime ile Başla
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
