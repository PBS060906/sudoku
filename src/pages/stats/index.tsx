import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { useStatsStore } from '@/store';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/engine/difficulty';
import { formatClock, formatDuration } from '@/utils/time';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const stats = useStatsStore();

  const totals = useMemo(() => {
    let started = 0;
    let won = 0;
    let perfect = 0;
    let duration = 0;
    DIFFICULTY_ORDER.forEach((level) => {
      const item = stats.byDifficulty[level];
      started += item.started;
      won += item.won;
      perfect += item.perfectWins;
      duration += item.totalDurationMs;
    });
    return {
      started,
      won,
      perfect,
      duration,
      winRate: started > 0 ? Math.round((won / started) * 100) : 0
    };
  }, [stats.byDifficulty]);

  const isEmpty = totals.started === 0;

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>我的数据</Text>
        <Text className={styles.headerDesc}>每一次完成都算数</Text>
      </View>

      {isEmpty ? (
        <View className={styles.emptyCard}>
          <Text className={styles.emptyEmoji}>🧩</Text>
          <Text className={styles.emptyTitle}>还没有对局记录</Text>
          <Text className={styles.emptyDesc}>回到首页开始第一局，数据会自动保存在本机</Text>
        </View>
      ) : (
        <>
          <View className={styles.summary}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{totals.won}</Text>
              <Text className={styles.summaryLabel}>完成局数</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{totals.winRate}%</Text>
              <Text className={styles.summaryLabel}>完成率</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValueAccent}>{stats.currentStreak}</Text>
              <Text className={styles.summaryLabel}>当前连胜</Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValueAccent}>{stats.bestStreak}</Text>
              <Text className={styles.summaryLabel}>最长连胜</Text>
            </View>
          </View>

          <View className={styles.miniRow}>
            <View className={styles.miniItem}>
              <Text className={styles.miniValue}>{stats.dailySolvedDates.length}</Text>
              <Text className={styles.miniLabel}>每日挑战完成</Text>
            </View>
            <View className={styles.miniItem}>
              <Text className={styles.miniValue}>{totals.perfect}</Text>
              <Text className={styles.miniLabel}>零错误完成</Text>
            </View>
            <View className={styles.miniItem}>
              <Text className={styles.miniValue}>{formatDuration(totals.duration)}</Text>
              <Text className={styles.miniLabel}>累计思考</Text>
            </View>
          </View>

          <View className={styles.section}>
            <SectionHeader title="分难度战绩" desc="最佳用时与完成进度" />
            {DIFFICULTY_ORDER.map((level) => {
              const config = DIFFICULTIES[level];
              const item = stats.byDifficulty[level];
              const ratio = item.started > 0 ? Math.round((item.won / item.started) * 100) : 0;
              return (
                <View key={level} className={styles.levelCard}>
                  <View className={styles.levelHead}>
                    <View className={styles.levelNameWrap}>
                      <View className={styles.dot} style={{ background: config.color }} />
                      <Text className={styles.levelName}>{config.label}</Text>
                    </View>
                    <Text className={styles.levelRate}>{ratio}%</Text>
                  </View>
                  <View className={styles.track}>
                    <View
                      className={styles.fill}
                      style={{ width: `${ratio}%`, background: config.color }}
                    />
                  </View>
                  <View className={styles.levelFoot}>
                    <Text className={styles.footText}>
                      完成 {item.won}/{item.started} 局
                    </Text>
                    <Text className={styles.footText}>
                      最佳 {item.bestDurationMs !== null ? formatClock(item.bestDurationMs) : '—'}
                    </Text>
                    <Text className={styles.footText}>
                      平均{' '}
                      {item.won > 0 ? formatClock(Math.round(item.totalDurationMs / item.won)) : '—'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

export default StatsPage;
