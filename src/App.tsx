import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Home,
  Settings,
} from 'lucide-react';
import { AppStoreProvider, useAppStore } from './store/useAppStore';
import { DesktopStudioFrame } from './components/DesktopStudioFrame';
import { OnboardingView } from './components/OnboardingView';
import { TodayTab } from './components/TodayTab';
import { DictionaryTab } from './components/DictionaryTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { SwipeTriageOverlay } from './components/SwipeTriageOverlay';
import { StudyFlashcardsOverlay } from './components/StudyFlashcardsOverlay';
import { QuizOverlay } from './components/QuizOverlay';
import { ReviewOverlay } from './components/ReviewOverlay';
import type { AppTab } from './types';

const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'today', label: 'Bugün', icon: Home },
  { id: 'dictionary', label: 'Sözlük', icon: BookOpen },
  { id: 'stats', label: 'İstatistik', icon: BarChart3 },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

const MobileAppShell: React.FC = () => {
  const { state, activeTab, setActiveTab, overlay, dueReviewWords } = useAppStore();

  if (!state.settings.onboardingCompleted) {
    return <OnboardingView />;
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F7FAFF]">
      {/* Scrollable Active Tab Content */}
      <main
        className={`flex-1 min-h-0 ${
          activeTab === 'dictionary' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'
        }`}
      >
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'dictionary' && <DictionaryTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Mobile Navigation Bar */}
      <nav
        aria-label="Ana menü"
        className="shrink-0 bg-white/95 backdrop-blur border-t border-[#E6EEF9] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition ${
                  active
                    ? 'text-[#2563EB]'
                    : 'text-[#94A3B8] hover:text-[#475569]'
                }`}
              >
                <div
                  className={`flex h-8 w-12 items-center justify-center rounded-xl transition ${
                    active ? 'bg-[#EFF6FF]' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : 'stroke-[2]'}`} />
                </div>
                <span className={`text-[10px] ${active ? 'font-extrabold' : 'font-semibold'}`}>
                  {item.label}
                </span>
                {item.id === 'today' && dueReviewWords.length > 0 && !active && (
                  <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-[#2563EB]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Fullscreen Interactive Session Overlays (Triage / Study / Quiz / Review) */}
      <AnimatePresence>
        {overlay.type !== 'none' && (
          <motion.div
            key={overlay.type}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 z-40 bg-[#F7FAFF] overflow-hidden"
          >
            {overlay.type === 'triage' && <SwipeTriageOverlay />}
            {overlay.type === 'study' && <StudyFlashcardsOverlay />}
            {overlay.type === 'quiz' && <QuizOverlay />}
            {overlay.type === 'review' && <ReviewOverlay />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function App() {
  return (
    <AppStoreProvider>
      <DesktopStudioFrame>
        <MobileAppShell />
      </DesktopStudioFrame>
    </AppStoreProvider>
  );
}

export default App;
