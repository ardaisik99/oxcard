import React, { useRef, useState } from 'react';
import {
  Check,
  Download,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { speakEnglish } from '../utils/speech';
import type { LevelFilterPref } from '../types';

const PRESET_GOALS = [5, 10, 15, 20, 30];

export const SettingsTab: React.FC = () => {
  const {
    state,
    updateSettings,
    exportBackup,
    importBackup,
    resetAllData,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showStatus = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 2600);
  };

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oxcard-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Yedek dosyası indirildi!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackup(String(reader.result || ''));
      if (res.ok) {
        showStatus('Yedek başarıyla geri yüklendi!');
      } else {
        showStatus(res.error || 'Yedek yüklenemedi.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div>
        <h1 className="font-display text-lg font-extrabold text-[#0F172A]">Ayarlar</h1>
        <p className="text-[11px] font-medium text-[#64748B]">
          Öğrenme hedefini ve tercihlerini özelleştir
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold border ${
            statusMsg.isError
              ? 'bg-[#FFF7ED] text-[#B45309] border-[#FDE68A]'
              : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Profile Name */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <label htmlFor="settings-name" className="block text-xs font-bold text-[#0F172A] mb-2">
          İsmin
        </label>
        <input
          id="settings-name"
          type="text"
          maxLength={24}
          value={state.settings.userName}
          onChange={(e) => updateSettings({ userName: e.target.value })}
          placeholder="İsmini yazabilirsin (isteğe bağlı)"
          className="w-full rounded-xl bg-[#F8FAFF] border border-[#DCE7F7] px-3.5 py-2.5 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:outline-none transition"
        />
      </div>

      {/* Daily Goal */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Günlük Kelime Hedefi</div>
            <div className="text-[11px] text-[#64748B]">
              Her gün kaç yeni kelime öğrenmek istersin?
            </div>
          </div>
          <span className="rounded-xl bg-[#EFF6FF] px-3 py-1 font-display text-sm font-extrabold text-[#2563EB] border border-[#DBEAFE]">
            {state.settings.dailyGoal}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mb-3.5">
          {PRESET_GOALS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => updateSettings({ dailyGoal: val })}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                state.settings.dailyGoal === val
                  ? 'bg-[#2563EB] text-white shadow-soft'
                  : 'bg-[#F4F8FF] text-[#334155] hover:bg-[#E8F1FF]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <input
          type="range"
          min={5}
          max={50}
          step={1}
          value={state.settings.dailyGoal}
          onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}
          className="ox-slider w-full"
          aria-label="Günlük hedef"
        />
      </div>

      {/* Starting Level */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9]">
        <div className="text-xs font-bold text-[#0F172A] mb-1">Öncelikli Seviye</div>
        <p className="text-[11px] text-[#64748B] mb-3">
          Günlük keşif kartlarının hangi seviyeden başlamasını istersin?
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as LevelFilterPref[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => updateSettings({ startLevel: lvl })}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                state.settings.startLevel === lvl
                  ? 'bg-[#2563EB] text-white shadow-soft'
                  : 'bg-[#F4F8FF] text-[#334155] hover:bg-[#E8F1FF]'
              }`}
            >
              {lvl === 'ALL' ? 'A1–B2' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Audio & Study Preferences */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Telaffuz Aksanı</div>
            <div className="text-[11px] text-[#64748B]">Sesli okuma tercihin</div>
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
                onClick={() => {
                  updateSettings({ accent: ac.id });
                  speakEnglish('vocabulary', ac.id, state.settings.speechRate);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  state.settings.accent === ac.id
                    ? 'bg-[#2563EB] text-white shadow-soft'
                    : 'text-[#64748B]'
                }`}
              >
                {ac.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3.5">
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Otomatik Sesli Okuma</div>
            <div className="text-[11px] text-[#64748B]">Yeni kart geldiğinde kelimeyi oku</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.settings.autoSpeak}
            onClick={() => updateSettings({ autoSpeak: !state.settings.autoSpeak })}
            className={`relative h-7 w-12 rounded-full transition ${
              state.settings.autoSpeak ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.settings.autoSpeak ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3.5">
          <div>
            <div className="text-xs font-bold text-[#0F172A]">Pekiştirme Testi</div>
            <div className="text-[11px] text-[#64748B]">Kartlardan sonra hızlı test aç</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.settings.includeQuiz}
            onClick={() => updateSettings({ includeQuiz: !state.settings.includeQuiz })}
            className={`relative h-7 w-12 rounded-full transition ${
              state.settings.includeQuiz ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.settings.includeQuiz ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => speakEnglish('Hello! Ready to learn Oxford three thousand words.', state.settings.accent, state.settings.speechRate)}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#F4F8FF] py-2.5 text-xs font-bold text-[#2563EB] border border-[#DBEAFE] hover:bg-[#EFF6FF] transition"
        >
          <Volume2 className="h-3.5 w-3.5" />
          Telaffuz Sesini Test Et
        </button>
      </div>

      {/* Data Backup & Reset */}
      <div className="rounded-2xl bg-white p-4 shadow-soft border border-[#E6EEF9] space-y-2.5">
        <div className="text-xs font-bold text-[#0F172A] mb-1">Veri ve Yedekleme</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F4F8FF] py-2.5 px-3 text-xs font-bold text-[#1D4ED8] border border-[#DBEAFE] hover:bg-[#EFF6FF] transition"
          >
            <Download className="h-3.5 w-3.5" />
            Yedek İndir
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F8FAFC] py-2.5 px-3 text-xs font-bold text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition"
          >
            <Upload className="h-3.5 w-3.5" />
            Yedek Yükle
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        <div className="pt-2 border-t border-[#F1F5F9]">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#FFF7ED] hover:text-[#B45309] transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Tüm İlerlemeyi Sıfırla
            </button>
          ) : (
            <div className="rounded-xl bg-[#FFF7ED] border border-[#FDE68A] p-3">
              <p className="text-xs font-bold text-[#92400E] text-center mb-2.5">
                Tüm kayıtlı kelimelerin ve serin sıfırlanacak. Emin misin?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-white py-2 text-xs font-bold text-[#475569] border border-[#E2E8F0]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmReset(false);
                    resetAllData();
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#DC2626] py-2 text-xs font-bold text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  Evet, Sıfırla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Attribution */}
      <p className="text-center text-[10px] text-[#94A3B8] pb-2">
        OxCard • Oxford 3000 Kelime Kartları · Veriler tarayıcında güvenle saklanır.
      </p>
    </div>
  );
};
