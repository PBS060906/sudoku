import React, { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidHide, useDidShow, useRouter } from '@tarojs/taro';
import { useGameStore, useSettingsStore } from '@/store';
import { DIFFICULTIES } from '@/engine/difficulty';
import type { BoardSize, DifficultyLevel, Digit } from '@/engine/types';
import { hashString } from '@/engine/rng';
import { dateStr, formatClock } from '@/utils/time';
import { currentElapsed, remainingCounts } from '@/engine/sudoku';
import { haptic } from '@/utils/feedback';
import SudokuBoard from '@/components/SudokuBoard';
import NumberPad from '@/components/NumberPad';
import GameToolbar, { type ToolAction } from '@/components/GameToolbar';
import WinModal from '@/components/WinModal';
import styles from './index.module.scss';

const LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert', 'master'];
const SIZES: BoardSize[] = [4, 6, 9];

function asLevel(value?: string): DifficultyLevel | null {
  return value && LEVELS.includes(value as DifficultyLevel) ? (value as DifficultyLevel) : null;
}

function asSize(value?: string): BoardSize | null {
  const n = Number(value);
  return SIZES.includes(n as BoardSize) ? (n as BoardSize) : null;
}

const GamePage: React.FC = () => {
  const router = useRouter();
  const params = router.params as {
    level?: string;
    size?: string;
    daily?: string;
    continue?: string;
  };

  const game = useGameStore((s) => s.game);
  const settings = useSettingsStore();
  const [loading, setLoading] = useState(true);

  // 初始化题目（同步出题可能耗时，放到 setTimeout 中让 Loading 先渲染）
  useEffect(() => {
    const timer = setTimeout(() => {
      const store = useGameStore.getState();
      const preset = useSettingsStore.getState();

      if (params.continue) {
        if (!store.game) {
          store.startNew(preset.defaultLevel, preset.defaultSize);
        }
      } else if (params.daily) {
        const seed = hashString(`daily-${dateStr()}`);
        const existing = store.game;
        if (
          !existing ||
          !existing.isDaily ||
          existing.seed !== seed ||
          existing.status === 'won'
        ) {
          store.startDaily();
        }
      } else {
        const level = asLevel(params.level) ?? preset.defaultLevel;
        const size = asSize(params.size) ?? preset.defaultSize;
        store.startNew(level, size);
      }
      setLoading(false);
      console.info('[Game] puzzle ready:', params);
    }, 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 计时心跳
  useEffect(() => {
    const timer = setInterval(() => {
      useGameStore.getState().tick();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useDidHide(() => {
    useGameStore.getState().pause();
  });

  useDidShow(() => {
    // 回到页面不自动恢复计时，由玩家点击「继续」
  });

  const onSelect = (index: number) => {
    useGameStore.getState().select(index);
  };

  const onPressDigit = (digit: Digit) => {
    const result = useGameStore.getState().input(digit);
    if (!result) return;
    if (result.won) {
      haptic(settings.hapticEnabled, 'medium');
    } else {
      haptic(settings.hapticEnabled, result.wrong ? 'medium' : 'light');
    }
  };

  const onAction = (action: ToolAction) => {
    const store = useGameStore.getState();
    haptic(settings.hapticEnabled, 'light');
    switch (action) {
      case 'undo':
        store.undo();
        break;
      case 'redo':
        store.redo();
        break;
      case 'erase':
        store.erase();
        break;
      case 'notes':
        store.toggleNoteMode();
        break;
      case 'hint':
        store.hint();
        break;
      case 'check': {
        const result = store.check();
        if (!result) return;
        if (result.wrong > 0) {
          Taro.showToast({ title: `有 ${result.wrong} 处错误`, icon: 'none' });
        } else if (result.empty > 0) {
          Taro.showToast({ title: `填写正确，还差 ${result.empty} 格`, icon: 'none' });
        } else {
          Taro.showToast({ title: '全部正确！', icon: 'success' });
        }
        break;
      }
    }
  };

  const onPause = () => {
    useGameStore.getState().pause();
  };

  const onResume = () => {
    useGameStore.getState().resume();
    haptic(settings.hapticEnabled, 'light');
  };

  const onReplay = () => {
    if (!game) return;
    setLoading(true);
    setTimeout(() => {
      useGameStore.getState().startNew(game.difficulty, game.size);
      setLoading(false);
    }, 40);
  };

  const onHome = () => {
    Taro.navigateBack({
      fail: () => {
        Taro.switchTab({ url: '/pages/index/index' });
      }
    });
  };

  if (loading || !game) {
    return (
      <View className={styles.loading}>
        <Text className={styles.loadingEmoji}>🧩</Text>
        <Text className={styles.loadingText}>正在生成题目…</Text>
      </View>
    );
  }

  const remaining = remainingCounts(game.values, game.solution, game.size);
  const elapsed = currentElapsed(game);
  const config = DIFFICULTIES[game.difficulty];

  return (
    <View className={styles.page}>
      <View className={styles.topBar}>
        <View className={styles.titleWrap}>
          <Text className={styles.dot} style={{ background: config.color }} />
          <Text className={styles.title}>{config.label}</Text>
          <Text className={styles.sizeText}>
            {game.size}×{game.size}
          </Text>
          {game.isDaily ? <Text className={styles.dailyTag}>每日</Text> : null}
        </View>
        <View className={styles.timerWrap}>
          {settings.showTimer ? (
            <Text className={styles.timer}>{formatClock(elapsed)}</Text>
          ) : null}
          <View className={styles.pauseButton} onClick={onPause}>
            <Text className={styles.pauseIcon}>⏸</Text>
          </View>
        </View>
      </View>

      <View className={styles.statusRow}>
        <Text className={styles.statusItem}>错误 {game.mistakes}</Text>
        <Text className={styles.statusItem}>提示 {game.hintsUsed}</Text>
        {game.noteMode ? <Text className={styles.noteTagOn}>笔记模式</Text> : null}
      </View>

      <View className={styles.boardWrap}>
        <SudokuBoard
          game={game}
          theme={settings.boardTheme}
          highlightPeers={settings.highlightPeers}
          highlightSameDigit={settings.highlightSameDigit}
          highlightMistakes={settings.highlightMistakes}
          onSelect={onSelect}
          onResume={onResume}
        />
      </View>

      <View className={styles.padWrap}>
        <NumberPad
          size={game.size}
          remaining={remaining}
          noteMode={game.noteMode}
          onPress={onPressDigit}
        />
      </View>

      <View className={styles.toolbarWrap}>
        <GameToolbar
          canUndo={game.undoStack.length > 0}
          canRedo={game.redoStack.length > 0}
          noteMode={game.noteMode}
          onAction={onAction}
        />
      </View>

      <WinModal game={game} onReplay={onReplay} onHome={onHome} />
    </View>
  );
};

export default GamePage;
