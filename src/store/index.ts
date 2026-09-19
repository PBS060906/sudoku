// ============================================
// 统一 hydration：App 启动时恢复本地数据
// ============================================

import { useGameStore } from './gameStore';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

export function hydrateAll(): void {
  useSettingsStore.getState().hydrate();
  useStatsStore.getState().hydrate();
  useGameStore.getState().hydrate();
}

export { useGameStore, useSettingsStore, useStatsStore };
