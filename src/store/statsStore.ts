// ============================================
// 统计 Store：局数/胜率/最佳用时/连胜/每日挑战
// ============================================

import { create } from 'zustand';
import { DIFFICULTY_ORDER } from '@/engine/difficulty';
import type { DifficultyLevel } from '@/engine/types';
import { dateStr, dayDiff } from '@/utils/time';
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage';

export interface DifficultyStat {
  started: number;
  won: number;
  /** 零错误完成数 */
  perfectWins: number;
  totalDurationMs: number;
  bestDurationMs: number | null;
  starsTotal: number;
}

const emptyStat = (): DifficultyStat => ({
  started: 0,
  won: 0,
  perfectWins: 0,
  totalDurationMs: 0,
  bestDurationMs: null,
  starsTotal: 0
});

function emptyByDifficulty(): Record<DifficultyLevel, DifficultyStat> {
  return DIFFICULTY_ORDER.reduce((acc, key) => {
    acc[key] = emptyStat();
    return acc;
  }, {} as Record<DifficultyLevel, DifficultyStat>);
}

export interface WinRecord {
  level: DifficultyLevel;
  durationMs: number;
  mistakes: number;
  hints: number;
  stars: number;
  isDaily: boolean;
}

interface StatsStore {
  hydrated: boolean;
  byDifficulty: Record<DifficultyLevel, DifficultyStat>;
  currentStreak: number;
  bestStreak: number;
  lastWinDate: string | null;
  dailySolvedDates: string[];
  totalHints: number;
  totalMistakes: number;
  hydrate: () => void;
  recordStart: (level: DifficultyLevel) => void;
  recordWin: (record: WinRecord) => void;
  isDailySolved: (date: string) => boolean;
  reset: () => void;
}

export const useStatsStore = create<StatsStore>((set, get) => {
  const persist = () => {
    const { hydrated: _h, hydrate: _hy, recordStart: _rs, recordWin: _rw, isDailySolved: _i, reset: _r, ...data } = get();
    writeStorage(STORAGE_KEYS.stats, data);
  };

  return {
    hydrated: false,
    byDifficulty: emptyByDifficulty(),
    currentStreak: 0,
    bestStreak: 0,
    lastWinDate: null,
    dailySolvedDates: [],
    totalHints: 0,
    totalMistakes: 0,

    hydrate: () => {
      const saved = readStorage<Partial<StatsStore>>(STORAGE_KEYS.stats, {});
      set({
        byDifficulty: { ...emptyByDifficulty(), ...(saved.byDifficulty ?? {}) },
        currentStreak: saved.currentStreak ?? 0,
        bestStreak: saved.bestStreak ?? 0,
        lastWinDate: saved.lastWinDate ?? null,
        dailySolvedDates: saved.dailySolvedDates ?? [],
        totalHints: saved.totalHints ?? 0,
        totalMistakes: saved.totalMistakes ?? 0,
        hydrated: true
      });
    },

    recordStart: (level) => {
      const by = get().byDifficulty;
      set({
        byDifficulty: {
          ...by,
          [level]: { ...by[level], started: by[level].started + 1 }
        }
      });
      persist();
    },

    recordWin: ({ level, durationMs, mistakes, hints, stars, isDaily }) => {
      const state = get();
      const old = state.byDifficulty[level];
      const today = dateStr();

      let streak = state.currentStreak;
      if (state.lastWinDate !== today) {
        if (state.lastWinDate && dayDiff(state.lastWinDate, today) === 1) {
          streak += 1;
        } else {
          streak = 1;
        }
      }

      const dailySolvedDates =
        isDaily && !state.dailySolvedDates.includes(today)
          ? [...state.dailySolvedDates, today]
          : state.dailySolvedDates;

      set({
        byDifficulty: {
          ...state.byDifficulty,
          [level]: {
            started: old.started,
            won: old.won + 1,
            perfectWins: old.perfectWins + (mistakes === 0 ? 1 : 0),
            totalDurationMs: old.totalDurationMs + durationMs,
            bestDurationMs:
              old.bestDurationMs === null ? durationMs : Math.min(old.bestDurationMs, durationMs),
            starsTotal: old.starsTotal + stars
          }
        },
        currentStreak: streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lastWinDate: today,
        dailySolvedDates,
        totalHints: state.totalHints + hints,
        totalMistakes: state.totalMistakes + mistakes
      });
      persist();
    },

    isDailySolved: (date) => get().dailySolvedDates.includes(date),

    reset: () => {
      set({
        byDifficulty: emptyByDifficulty(),
        currentStreak: 0,
        bestStreak: 0,
        lastWinDate: null,
        dailySolvedDates: [],
        totalHints: 0,
        totalMistakes: 0
      });
      persist();
    }
  };
});
