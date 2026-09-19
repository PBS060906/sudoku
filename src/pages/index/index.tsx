import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useGameStore, useSettingsStore, useStatsStore } from '@/store';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/engine/difficulty';
import type { BoardSize, DifficultyLevel } from '@/engine/types';
import { progressOf } from '@/engine/sudoku';
import { dateStr, formatClock } from '@/utils/time';
import SectionHeader from '@/components/SectionHeader';
import DifficultyCard from '@/components/DifficultyCard';
import styles from './index.module.scss';

const SIZE_OPTIONS: { value: BoardSize; label: string }[] = [
  { value: 4, label: '4×4' },
  { value: 6, label: '6×6' },
  { value: 9, label: '9×9' }
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

const IndexPage: React.FC = () => {
  const game = useGameStore((s) => s.game);
  const settings = useSettingsStore();
  const stats = useStatsStore();
  const [size, setSize] = useState<BoardSize>(settings.defaultSize);

  const today = dateStr();
  const dailySolved = stats.isDailySolved(today);

  const totals = useMemo(() => {
    let started = 0;
    let won = 0;
    DIFFICULTY_ORDER.forEach((level) => {
      started += stats.byDifficulty[level].started;
      won += stats.byDifficulty[level].won;
    });
    return { started, won, winRate: started > 0 ? Math.round((won / started) * 100) : 0 };
  }, [stats.byDifficulty]);

  const canContinue = !!game && game.status !== 'won';

  const startGame = (level: DifficultyLevel, boardSize: BoardSize) => {
    Taro.navigateTo({ url: `/pages/game/index?level=${level}&size=${boardSize}` });
  };

  const continueGame = () => {
    Taro.navigateTo({ url: '/pages/game/index?continue=1' });
  };

  const startDaily = () => {
    Taro.navigateTo({ url: '/pages/game/index?daily=1' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroTop}>
          <View>
            <Text className={styles.greeting}>{greeting()}，欢迎回来</Text>
            <Text className={styles.dateText}>{today}</Text>
          </View>
          {stats.currentStreak > 0 ? (
            <View className={styles.streak}>
              <Text className={styles.streakIcon}>🔥</Text>
              <Text className={styles.streakText}>{stats.currentStreak} 天连胜</Text>
            </View>
          ) : null}
        </View>

        {canContinue && game ? (
          <View className={styles.continueCard} onClick={continueGame}>
            <View className={styles.continueInfo}>
              <Text className={styles.continueTitle}>继续上一局</Text>
              <Text className={styles.continueMeta}>
                {DIFFICULTIES[game.difficulty].label} · {game.size}×{game.size} · 已完成{' '}
                {progressOf(game)}% · {formatClock(game.elapsedMs)}
              </Text>
            </View>
            <View className={styles.continueButton}>
              <Text className={styles.continueButtonText}>继续</Text>
            </View>
          </View>
        ) : null}

        <View className={styles.dailyCard} onClick={startDaily}>
          <View className={styles.dailyIcon}>
            <Text className={styles.dailyEmoji}>📅</Text>
          </View>
          <View className={styles.continueInfo}>
            <Text className={styles.continueTitle}>每日挑战</Text>
            <Text className={styles.continueMeta}>
              {dailySolved ? '今日已完成，明天再来' : '所有玩家今日同一题，来试试'}
            </Text>
          </View>
          <View className={classnames(styles.dailyBadge, dailySolved && styles.dailyBadgeDone)}>
            <Text className={styles.dailyBadgeText}>{dailySolved ? '✓' : 'GO'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <SectionHeader title="新建对局" desc="选择棋盘规格与难度" />

        <View className={styles.sizeTabs}>
          {SIZE_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={classnames(styles.sizeTab, size === option.value && styles.sizeTabActive)}
              onClick={() => setSize(option.value)}
            >
              <Text
                className={classnames(
                  styles.sizeTabText,
                  size === option.value && styles.sizeTabTextActive
                )}
              >
                {option.label}
              </Text>
            </View>
          ))}
        </View>

        {DIFFICULTY_ORDER.map((level) => {
          const config = DIFFICULTIES[level];
          const stat = stats.byDifficulty[level];
          return (
            <DifficultyCard
              key={level}
              label={config.label}
              description={config.description}
              color={config.color}
              bestText={stat.bestDurationMs !== null ? formatClock(stat.bestDurationMs) : undefined}
              onPlay={() => startGame(level, size)}
            />
          );
        })}

        <SectionHeader title="我的战绩" desc="坚持每日一局" />
        <View className={styles.quickStats}>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>{totals.started}</Text>
            <Text className={styles.quickStatLabel}>总对局</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValue}>{totals.won}</Text>
            <Text className={styles.quickStatLabel}>已完成</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatValueAccent}>{totals.winRate}%</Text>
            <Text className={styles.quickStatLabel}>完成率</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
