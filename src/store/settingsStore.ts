// ============================================
// 设置 Store（对应 LibreSudoku 的辅助功能选项）
// ============================================

import { create } from 'zustand';
import type { BoardSize, BoardThemeName, DifficultyLevel, EngineSettings } from '@/engine/types';
import { readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage';

export interface Settings extends EngineSettings {
  /** 高亮当前格所在的行/列/宫 */
  highlightPeers: boolean;
  /** 高亮盘面中相同的数字 */
  highlightSameDigit: boolean;
  /** 实时标记错误数字 */
  highlightMistakes: boolean;
  /** 显示计时器 */
  showTimer: boolean;
  /** 振动反馈 */
  hapticEnabled: boolean;
  /** 棋盘主题 */
  boardTheme: BoardThemeName;
  /** 默认开局难度 */
  defaultLevel: DifficultyLevel;
  /** 默认棋盘规格 */
  defaultSize: BoardSize;
}

export const DEFAULT_SETTINGS: Settings = {
  highlightPeers: true,
  highlightSameDigit: true,
  highlightMistakes: true,
  autoRemoveNotes: true,
  showTimer: true,
  hapticEnabled: true,
  boardTheme: 'classic',
  defaultLevel: 'easy',
  defaultSize: 9
};

type ToggleKey =
  | 'highlightPeers'
  | 'highlightSameDigit'
  | 'highlightMistakes'
  | 'autoRemoveNotes'
  | 'showTimer'
  | 'hapticEnabled';

interface SettingsStore extends Settings {
  hydrated: boolean;
  hydrate: () => void;
  update: (patch: Partial<Settings>) => void;
  toggle: (key: ToggleKey) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: () => {
    const saved = readStorage<Partial<Settings>>(STORAGE_KEYS.settings, {});
    set({ ...DEFAULT_SETTINGS, ...saved, hydrated: true });
  },

  update: (patch) => {
    set(patch);
    const { hydrated: _hydrated, hydrate: _h, update: _u, toggle: _t, reset: _r, ...persisted } = get();
    writeStorage(STORAGE_KEYS.settings, persisted);
  },

  toggle: (key) => {
    get().update({ [key]: !get()[key] } as Partial<Settings>);
  },

  reset: () => {
    set({ ...DEFAULT_SETTINGS });
    writeStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  }
}));
