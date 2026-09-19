import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  desc?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc }) => {
  return (
    <View className={styles.header}>
      <View className={styles.indicator} />
      <View className={styles.texts}>
        <Text className={styles.title}>{title}</Text>
        {desc ? <Text className={styles.desc}>{desc}</Text> : null}
      </View>
    </View>
  );
};

export default SectionHeader;
