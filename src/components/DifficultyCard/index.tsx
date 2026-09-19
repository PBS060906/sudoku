import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface DifficultyCardProps {
  label: string;
  description: string;
  color: string;
  bestText?: string;
  onPlay: () => void;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({
  label,
  description,
  color,
  bestText,
  onPlay
}) => {
  return (
    <View className={styles.card}>
      <View className={styles.badge} style={{ background: color }}>
        <Text className={styles.badgeText}>{label.charAt(0)}</Text>
      </View>
      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.label}>{label}</Text>
          {bestText ? <Text className={styles.best}>最佳 {bestText}</Text> : null}
        </View>
        <Text className={styles.desc}>{description}</Text>
      </View>
      <View className={styles.play} style={{ background: color }} onClick={onPlay}>
        <Text className={styles.playText}>开局</Text>
      </View>
    </View>
  );
};

export default DifficultyCard;
