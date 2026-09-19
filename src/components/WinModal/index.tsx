import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { DIFFICULTIES } from '@/engine/difficulty';
import type { GameState } from '@/engine/types';
import { formatClock } from '@/utils/time';
import styles from './index.module.scss';

interface WinModalProps {
  game: GameState | null;
  onReplay: () => void;
  onHome: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ game, onReplay, onHome }) => {
  if (!game || game.status !== 'won') return null;

  return (
    <View className={styles.mask}>
      <View className={styles.card}>
        <Text className={styles.trophy}>🏆</Text>
        <Text className={styles.title}>恭喜完成！</Text>
        <Text className={styles.subtitle}>
          {DIFFICULTIES[game.difficulty].label} · {game.size}×{game.size}
          {game.isDaily ? ' · 每日挑战' : ''}
        </Text>

        <View className={styles.stars}>
          {[1, 2, 3].map((star) => (
            <Text
              key={star}
              className={classnames(styles.star, star <= game.stars && styles.starOn)}
            >
              ★
            </Text>
          ))}
        </View>

        <View className={styles.metrics}>
          <View className={styles.metric}>
            <Text className={styles.metricValue}>{formatClock(game.elapsedMs)}</Text>
            <Text className={styles.metricLabel}>用时</Text>
          </View>
          <View className={styles.metric}>
            <Text className={styles.metricValue}>{game.mistakes}</Text>
            <Text className={styles.metricLabel}>错误</Text>
          </View>
          <View className={styles.metric}>
            <Text className={styles.metricValue}>{game.hintsUsed}</Text>
            <Text className={styles.metricLabel}>提示</Text>
          </View>
        </View>

        <View className={styles.buttonPrimary} onClick={onReplay}>
          <Text className={styles.buttonPrimaryText}>再来一局</Text>
        </View>
        <View className={styles.buttonPlain} onClick={onHome}>
          <Text className={styles.buttonPlainText}>返回首页</Text>
        </View>
      </View>
    </View>
  );
};

export default WinModal;
