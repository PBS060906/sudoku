// ============================================
// 本地持久化封装（纯离线，无网络请求）
// ============================================

import Taro from '@tarojs/taro';

export const STORAGE_KEYS = {
  settings: 'sudoku_moments_settings_v1',
  stats: 'sudoku_moments_stats_v1',
  currentGame: 'sudoku_moments_current_v1'
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw === '' || raw === null || raw === undefined) return fallback;
    if (typeof raw === 'string') {
      return JSON.parse(raw) as T;
    }
    return raw as T;
  } catch (error) {
    console.error('[Storage] read failed:', key, error);
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (error) {
    console.error('[Storage] write failed:', key, error);
  }
}

export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(key);
  } catch (error) {
    console.error('[Storage] remove failed:', key, error);
  }
}
