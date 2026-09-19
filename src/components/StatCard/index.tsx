import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent }) => {
  return (
    <View className={styles.card}>
      <Text className={styles.label}>{label}</Text>
      <Text className={accent ? styles.valueAccent : styles.value}>{value}</Text>
      {sub ? <Text className={styles.sub}>{sub}</Text> : null}
    </View>
  );
};

export default StatCard;
