import rawWords from './oxford3000.json';
import type { CEFRLevel, WordItem } from '../types';

export const OXFORD_WORDS: WordItem[] = rawWords as WordItem[];

export const WORD_BY_ID: Map<number, WordItem> = new Map(
  OXFORD_WORDS.map((item) => [item.id, item]),
);

export const LEVEL_COUNTS: Record<CEFRLevel, number> = OXFORD_WORDS.reduce(
  (acc, item) => {
    acc[item.lvl] += 1;
    return acc;
  },
  { A1: 0, A2: 0, B1: 0, B2: 0 } as Record<CEFRLevel, number>,
);

export const POS_TR_MAP: Record<string, string> = {
  noun: 'İsim',
  verb: 'Fiil',
  adjective: 'Sıfat',
  adverb: 'Zarf',
  preposition: 'Edat',
  conjunction: 'Bağlaç',
  pronoun: 'Zamir',
  determiner: 'Belirteç',
  exclamation: 'Ünlem',
  interjection: 'Ünlem',
  'modal verb': 'Yardımcı Fiil',
  'auxiliary verb': 'Yardımcı Fiil',
  'phrasal verb': 'Deyim Fiil',
  number: 'Sayı',
  article: 'Tanımlık',
  word: 'Kelime',
};

export function getPosTurkish(pos: string): string {
  const key = pos.toLowerCase().trim();
  return POS_TR_MAP[key] || pos;
}

export const CEFR_META: Record<
  CEFRLevel,
  { label: string; desc: string; bg: string; text: string; border: string; bar: string }
> = {
  A1: {
    label: 'A1 • Başlangıç',
    desc: 'Günlük temel kelimeler',
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1D4ED8]',
    border: 'border-[#BFDBFE]',
    bar: 'bg-[#3B82F6]',
  },
  A2: {
    label: 'A2 • Temel',
    desc: 'Sık kullanılan ifadeler',
    bg: 'bg-[#E0F2FE]',
    text: 'text-[#0369A1]',
    border: 'border-[#BAE6FD]',
    bar: 'bg-[#0284C7]',
  },
  B1: {
    label: 'B1 • Orta',
    desc: 'Akıcı iletişim kelimeleri',
    bg: 'bg-[#EEF2FF]',
    text: 'text-[#3730A3]',
    border: 'border-[#C7D2FE]',
    bar: 'bg-[#4F46E5]',
  },
  B2: {
    label: 'B2 • Üst Orta',
    desc: 'Akademik ve iş İngilizcesi',
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#1E3A8A]',
    border: 'border-[#CBD5E1]',
    bar: 'bg-[#1E40AF]',
  },
};

export function getQuizOptions(target: WordItem, count = 4): WordItem[] {
  const samePool = OXFORD_WORDS.filter(
    (w) =>
      w.id !== target.id &&
      w.tr.toLowerCase() !== target.tr.toLowerCase() &&
      w.lvl === target.lvl &&
      w.pos === target.pos,
  );
  const fallbackPool = OXFORD_WORDS.filter(
    (w) => w.id !== target.id && w.tr.toLowerCase() !== target.tr.toLowerCase(),
  );

  const chosen: WordItem[] = [target];
  const seenTr = new Set<string>([target.tr.toLowerCase()]);

  const pickFrom = (pool: WordItem[]) => {
    let attempts = 0;
    while (chosen.length < count && attempts < 80 && pool.length > 0) {
      attempts += 1;
      const idx = Math.floor(Math.random() * pool.length);
      const candidate = pool[idx];
      const trKey = candidate.tr.toLowerCase();
      if (!seenTr.has(trKey)) {
        seenTr.add(trKey);
        chosen.push(candidate);
      }
    }
  };

  pickFrom(samePool);
  if (chosen.length < count) {
    pickFrom(fallbackPool);
  }

  // Fisher-Yates shuffle
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}
