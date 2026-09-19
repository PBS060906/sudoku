import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import type { BoardSize, Digit } from '@/engine/types';
import styles from './index.module.scss';

interface NumberPadProps {
  size: BoardSize;
  remaining: number[];
  noteMode: boolean;
  onPress: (digit: Digit) => void;
}

const NumberPad: React.FC<NumberPadProps> = ({ size, remaining, noteMode, onPress }) => {
  return (
    <View className={styles.pad}>
      {Array.from({ length: size }, (_, k) => k + 1).map((digit) => {
        const left = remaining[digit] ?? 0;
        const exhausted = left <= 0;
        return (
          <View
            key={digit}
            className={classnames(
              styles.key,
              noteMode && styles.keyNote,
              exhausted && styles.keyDisabled
            )}
            onClick={() => {
              if (!exhausted || noteMode) onPress(digit as Digit);
            }}
          >
            <Text className={styles.digit}>{digit}</Text>
            <Text className={styles.count}>{left > 0 ? left : ''}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default NumberPad;
