// ============================================
// 对局 Store：当前棋局、全部操作与自动存档
// ============================================

import { create } from 'zustand';
import type { BoardSize, CellValue, DifficultyLevel, GameState } from '@/engine/types';
import {
  applyHint,
  checkBoard as engineCheck,
  createGame,
  createPuzzle,
  eraseCell,
  inputDigit,
  pauseGame,
  redo as engineRedo,
  remainingCounts,
  restoreGame,
  resumeGame,
  selectCell,
  setNoteMode,
  tickGame,
  undo as engineUndo,
  type BoardCheckResult,
  type InputResult
} from '@/engine/sudoku';
import { hashString } from '@/engine/rng';
import { dateStr } from '@/utils/time';
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

interface GameStore {
  game: GameState | null;
  hydrated: boolean;
  hydrate: () => void;
  startNew: (level: DifficultyLevel, size: BoardSize) => GameState;
  startDaily: () => GameState;
  select: (index: number) => void;
  toggleNoteMode: () => void;
  input: (digit: CellValue) => InputResult | null;
  erase: () => void;
  hint: () => void;
  undo: () => void;
  redo: () => void;
  check: () => BoardCheckResult | null;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  clearCurrent: () => void;
}

function persistGame(game: GameState | null): void {
  if (game) {
    writeStorage(STORAGE_KEYS.currentGame, game);
  } else {
    removeStorage(STORAGE_KEYS.currentGame);
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const commit = (game: GameState, persist = true): void => {
    set({ game });
    if (persist) persistGame(game);
  };

  const beginGame = (level: DifficultyLevel, size: BoardSize, seed?: number, isDaily = false): GameState => {
    const puzzle = createPuzzle(level, size, seed);
    const game = createGame(puzzle, isDaily);
    commit(game);
    useStatsStore.getState().recordStart(level);
    return game;
  };

  const handleWin = (game: GameState): void => {
    useStatsStore.getState().recordWin({
      level: game.difficulty,
      durationMs: game.elapsedMs,
      mistakes: game.mistakes,
      hints: game.hintsUsed,
      stars: game.stars,
      isDaily: game.isDaily
    });
  };

  return {
    game: null,
    hydrated: false,

    hydrate: () => {
      const raw = readStorage<GameState | null>(STORAGE_KEYS.currentGame, null);
      set({ game: raw ? restoreGame(raw) : null, hydrated: true });
    },

    startNew: (level, size) => beginGame(level, size),

    startDaily: () => {
      const seed = hashString(`daily-${dateStr()}`);
      const settings = useSettingsStore.getState();
      return beginGame(settings.defaultLevel, 9, seed, true);
    },

    select: (index) => {
      const { game } = get();
      if (game) commit(selectCell(game, index), false);
    },

    toggleNoteMode: () => {
      const { game } = get();
      if (game) commit(setNoteMode(game, !game.noteMode), false);
    },

    input: (digit) => {
      const { game } = get();
      if (!game) return null;
      const result = inputDigit(game, digit, useSettingsStore.getState());
      commit(result.state);
      if (result.won) handleWin(result.state);
      return result;
    },

    erase: () => {
      const { game } = get();
      if (game) commit(eraseCell(game));
    },

    hint: () => {
      const { game } = get();
      if (!game) return;
      const next = applyHint(game);
      if (next !== game) {
        commit(next);
        if (next.status === 'won' && game.status !== 'won') handleWin(next);
      }
    },

    undo: () => {
      const { game } = get();
      if (game) commit(engineUndo(game));
    },

    redo: () => {
      const { game } = get();
      if (game) commit(engineRedo(game));
    },

    check: () => {
      const { game } = get();
      return game ? engineCheck(game) : null;
    },

    pause: () => {
      const { game } = get();
      if (game) commit(pauseGame(game));
    },

    resume: () => {
      const { game } = get();
      if (game) commit(resumeGame(game));
    },

    tick: () => {
      const { game } = get();
      if (game && game.status === 'playing') commit(tickGame(game), false);
    },

    clearCurrent: () => {
      set({ game: null });
      persistGame(null);
    }
  };
});

/** 供组件快速读取数字键盘剩余次数 */
export function selectRemaining(game: GameState): number[] {
  return remainingCounts(game.values, game.solution, game.size);
}

export type { CellValue };
